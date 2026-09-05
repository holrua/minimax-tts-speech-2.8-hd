"use client";

import * as React from "react";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  Settings2,
  Mic2,
  Pause,
  Music2,
  ChevronDown,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AudioPlayer } from "@/components/audio-player";
import { useToast } from "@/hooks/use-toast";
import {
  getApiKey,
  getSettings,
  setSettings,
  DEFAULT_SETTINGS,
  addHistory,
  utf8ByteLength,
  estimateCost,
  uid,
  getCustomVoices,
  type HistoryItem,
} from "@/lib/storage";
import { VOICE_PRESETS, VOICE_CATEGORIES, type VoiceCategory } from "@/lib/voices";
import {
  TTS_MODELS,
  getModel,
  DEFAULT_TTS_MODEL,
  FORMAT_OPTIONS,
  type RewindFormat,
} from "@/lib/rewind-models";
import {
  SOUND_TAG_PRESETS,
  SOUND_TAG_CATEGORIES,
  makePauseTag,
  extractPauseDurations,
  ADVANCED_EXAMPLES,
  type SoundTagPreset,
} from "@/lib/minimax-tags";

interface TtsPanelProps {
  onOpenSettings: () => void;
  onHistoryChange?: () => void;
  onVoicesChange?: () => void;
  refreshSignal?: number;
}

export function TtsPanel({
  onOpenSettings,
  onHistoryChange,
  onVoicesChange,
  refreshSignal,
}: TtsPanelProps) {
  const { toast } = useToast();
  const [text, setText] = React.useState("");
  const [voice, setVoice] = React.useState("Arabic_CalmWoman");
  const [category, setCategory] = React.useState<VoiceCategory>("arabic");
  const [speed, setSpeed] = React.useState(1);
  const [format, setFormat] = React.useState<RewindFormat>("mp3");
  const [model, setModel] = React.useState(DEFAULT_TTS_MODEL);
  const [useCustomId, setUseCustomId] = React.useState(false);
  const [customId, setCustomId] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resultSrc, setResultSrc] = React.useState<string | null>(null);
  const [resultMime, setResultMime] = React.useState<string>("audio/mpeg");
  const [hasKey, setHasKey] = React.useState(false);
  const [customVoices, setCustomVoicesState] = React.useState<
    { id: string; name: string }[]
  >([]);
  const [helpOpen, setHelpOpen] = React.useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Load settings once on mount and when refresh signal changes
  React.useEffect(() => {
    const s = getSettings();
    // Auto-fix: if the saved default voice is no longer in the catalog (e.g.
    // a removed cloned-voice preset), reset to the Arabic default and persist.
    const savedVoicePreset = VOICE_PRESETS.find((v) => v.id === s.defaultVoice);
    const validVoice = savedVoicePreset
      ? s.defaultVoice
      : DEFAULT_SETTINGS.defaultVoice;
    if (validVoice !== s.defaultVoice) {
      setSettings({ ...s, defaultVoice: validVoice });
    }
    setVoice(validVoice);
    setSpeed(s.speed);
    setFormat(s.outputFormat);
    // Sync the category dropdown to the saved voice's category so the right
    // list shows up. Falls back to "arabic" (the user's primary language).
    const preset = VOICE_PRESETS.find((v) => v.id === validVoice);
    setCategory(preset?.category ?? "arabic");
    // Auto-fix stale model ids to the current Rewind default.
    const validModel = getModel(s.model) ? s.model : DEFAULT_TTS_MODEL;
    if (validModel !== s.model) {
      setSettings({ ...s, model: validModel });
    }
    setModel(validModel);
    setHasKey(!!getApiKey());
    setCustomVoicesState(getCustomVoices().map((v) => ({ id: v.id, name: v.name })));
  }, [refreshSignal]);

  React.useEffect(() => {
    onVoicesChange?.();
  }, [customVoices, onVoicesChange]);

  const charCount = text.length;
  const byteLen = utf8ByteLength(text);
  const cost = estimateCost(byteLen);
  const overLimit = byteLen > 50000;

  // Count inline tags present in text (only honoured by the MiniMax models).
  const pauseCount = React.useMemo(
    () => extractPauseDurations(text).length,
    [text],
  );
  const soundTagCount = React.useMemo(
    () => (text.match(/\((?:[a-z][a-z -]{1,30})\)/gi) || []).length,
    [text],
  );

  // Inline pause/sound tags only apply to MiniMax Speech 2.8 HD/Turbo.
  const isMiniMax = /minimax\/speech-2\.8/.test(model);

  const filteredVoices = VOICE_PRESETS.filter((v) => v.category === category);

  // Insert text at the cursor position in the textarea
  const insertAtCursor = (snippet: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setText((t) => t + snippet);
      return;
    }
    const start = ta.selectionStart ?? text.length;
    const end = ta.selectionEnd ?? text.length;
    const newText = text.slice(0, start) + snippet + text.slice(end);
    setText(newText);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertExample = (example: string) => {
    setText(example);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const generate = async () => {
    setError(null);
    setResultSrc(null);
    const key = getApiKey();
    if (!key) {
      setHasKey(false);
      toast({
        title: "مفتاح API مفقود",
        description: "افتح الإعدادات وأدخل مفتاح Rewind.ai أولًا.",
        variant: "destructive",
      });
      onOpenSettings();
      return;
    }
    if (!text.trim()) {
      toast({
        title: "نص فارغ",
        description: "اكتب النص المراد تحويله إلى صوت.",
        variant: "destructive",
      });
      return;
    }
    if (overLimit) {
      toast({
        title: "تجاوز الحد",
        description: "النص يتجاوز 50,000 بايت.",
        variant: "destructive",
      });
      return;
    }
    const finalVoice = (useCustomId ? customId.trim() : voice) || "af_heart";

    setLoading(true);
    try {
      const res = await fetch("/api/tts/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: key,
          text,
          voice: finalVoice,
          speed,
          format,
          model,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.audio?.base64) {
        const msg = data?.error || `فشل التوليد (${res.status})`;
        setError(msg);
        toast({ title: "فشل التوليد", description: msg, variant: "destructive" });
        return;
      }
      const mime = data.audio.mimeType || "audio/mpeg";
      const dataUrl = `data:${mime};base64,${data.audio.base64}`;
      setResultSrc(dataUrl);
      setResultMime(mime);

      const vLabel =
        VOICE_PRESETS.find((v) => v.id === finalVoice)?.label || finalVoice;
      const item: HistoryItem = {
        id: uid("h"),
        text,
        voice: finalVoice,
        voiceLabel: vLabel,
        speed,
        format,
        model,
        audioBase64: data.audio.base64,
        mimeType: mime,
        createdAt: Date.now(),
      };
      addHistory(item);
      onHistoryChange?.();
      toast({
        title: "تم التوليد بنجاح",
        description: `الصوت جاهز للتشغيل والتنزيل.`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "خطأ في الاتصال بالخادم.";
      setError(msg);
      toast({ title: "خطأ", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Left: text input + advanced toolbar */}
      <div className="lg:col-span-3 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="tts-text" className="text-base font-semibold">
              النص المراد تحويله إلى صوت
            </Label>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`font-mono text-xs ${
                  overLimit ? "text-destructive" : ""
                }`}
              >
                {charCount.toLocaleString()} حرف
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px]">
                {byteLen.toLocaleString()} بايت
              </Badge>
              <Badge
                variant="secondary"
                className={
                  overLimit
                    ? "text-destructive"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              >
                ~${cost.toFixed(4)}
              </Badge>
            </div>
          </div>

          {/* Advanced inline-tag toolbar (MiniMax models only) */}
          {isMiniMax && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2">
              <PausePicker onInsert={(tag) => insertAtCursor(tag)} />
              <SoundTagPicker onInsert={insertAtCursor} />
              {(pauseCount > 0 || soundTagCount > 0) && (
                <div className="flex items-center gap-1.5 ms-auto">
                  {pauseCount > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Pause className="h-2.5 w-2.5" />
                      {pauseCount} إيقاف
                    </Badge>
                  )}
                  {soundTagCount > 0 && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Music2 className="h-2.5 w-2.5" />
                      {soundTagCount} مؤثر
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          <Textarea
            id="tts-text"
            ref={textareaRef}
            dir="auto"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب أو الصق النص هنا... يدعم اللغات المتعددة."
            className="min-h-[240px] resize-y text-base leading-relaxed scroll-area-custom"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>الحد الأقصى: 50,000 بايت (~16,000 حرف عربي)</span>
            <span>يُحتسب عدد الأحرف والتكلفة تلقائيًا أثناء الكتابة</span>
          </div>
        </div>

        {/* Examples / help (MiniMax models only) */}
        {isMiniMax && (
          <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
            <div className="rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between p-3 hover:bg-accent/40 transition-colors">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    أمثلة وشرح الصياغة المتقدمة (لنموذج MiniMax)
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${helpOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border/60 p-4 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <SyntaxCard
                      icon={<Pause className="h-4 w-4 text-primary" />}
                      title="إيقاف مؤقت"
                      syntax="<#0.5#>"
                      desc="يضيف وقفة بالمدة المحددة (بالثواني). لنماذج MiniMax فقط."
                      mono
                    />
                    <SyntaxCard
                      icon={<Music2 className="h-4 w-4 text-violet-500" />}
                      title="مؤثر صوتي"
                      syntax="(laughs)"
                      desc="يضيف مؤثرًا صوتيًا (ضحك، سعال...). لنماذج MiniMax فقط."
                      mono
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      جرّب هذه الأمثلة:
                    </p>
                    {ADVANCED_EXAMPLES.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => insertExample(ex.text)}
                        className="flex w-full items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 text-start hover:border-primary/50 hover:bg-accent/40 transition-colors"
                      >
                        <span className="text-xs font-semibold text-primary shrink-0 mt-0.5">
                          {ex.title}
                        </span>
                        <span
                          className="text-xs text-muted-foreground font-mono leading-relaxed flex-1"
                          dir="auto"
                        >
                          {ex.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>حدث خطأ</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {resultSrc && (
          <AudioPlayer
            src={resultSrc}
            mimeType={resultMime}
            fileName={`voicecraft-${Date.now()}`}
            autoPlay
          />
        )}
      </div>

      {/* Right: controls */}
      <div className="lg:col-span-2 space-y-5">
        <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">إعدادات التوليد</h3>
          </div>

          {/* Model picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">النموذج</Label>
              {(() => {
                const m = getModel(model);
                return m?.badge ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {m.badge}
                  </Badge>
                ) : null;
              })()}
            </div>
            <Select dir="rtl" value={model} onValueChange={setModel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {TTS_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex flex-col">
                      <span className="flex items-center gap-1.5">
                        {m.label}
                        {m.badge && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            {m.badge}
                          </Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground" dir="ltr">
                        {m.id}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(() => {
              const m = getModel(model);
              return m ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {m.description}
                </p>
              ) : null;
            })()}
          </div>

          {/* Voice source toggle */}
          <div className="space-y-2">
            <Label className="text-sm">مصدر الصوت</Label>
            <ToggleGroup
              type="single"
              value={useCustomId ? "custom" : "preset"}
              onValueChange={(v) => setUseCustomId(v === "custom")}
              className="w-full justify-start gap-2"
            >
              <ToggleGroupItem value="preset" className="flex-1 text-xs">
                من القائمة
              </ToggleGroupItem>
              <ToggleGroupItem value="custom" className="flex-1 text-xs">
                <Mic2 className="h-3.5 w-3.5 ms-1" />
                معرّف مخصص
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {!useCustomId ? (
            <>
              <div className="space-y-2">
                <Label className="text-sm">فئة الصوت</Label>
                <Select
                  dir="rtl"
                  value={category}
                  onValueChange={(v) => setCategory(v as VoiceCategory)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">الصوت</Label>
                <Select dir="rtl" value={voice} onValueChange={setVoice}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر صوتًا" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {category === "custom" && customVoices.length > 0
                      ? customVoices.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                          </SelectItem>
                        ))
                      : filteredVoices.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            <span className="flex flex-col">
                              <span>{v.label}</span>
                              <span
                                className="text-xs text-muted-foreground"
                                dir="ltr"
                              >
                                {v.id}
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
                {category !== "custom" && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {VOICE_PRESETS.find((v) => v.id === voice)?.description}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm">معرّف الصوت</Label>
              <Input
                dir="ltr"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="مثال: af_heart أو Arabic_CalmWoman"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                أدخل أي معرّف صوت مدعوم (Kokoro مثل af_heart، أو MiniMax مثل
                English_expressive_narrator).
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">سرعة التشغيل</Label>
              <Badge variant="secondary" className="font-mono text-xs">
                {speed.toFixed(2)}×
              </Badge>
            </div>
            <Slider
              dir="ltr"
              value={[speed]}
              min={0.5}
              max={2}
              step={0.05}
              onValueChange={(v) => setSpeed(v[0])}
              aria-label="سرعة التشغيل"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">صيغة الإخراج</Label>
            <ToggleGroup
              type="single"
              value={format}
              onValueChange={(v) => v && setFormat(v as RewindFormat)}
              className="w-full justify-start gap-2 flex-wrap"
            >
              {FORMAT_OPTIONS.map((f) => (
                <ToggleGroupItem key={f.value} value={f.value} className="text-xs">
                  {f.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <Button
          size="lg"
          onClick={generate}
          disabled={loading || overLimit}
          className="w-full gap-2 text-base h-12"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              جارٍ التوليد...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              توليد الصوت
            </>
          )}
        </Button>

        {!hasKey && (
          <p className="text-xs text-center text-muted-foreground">
            يلزم وجود مفتاح API —{" "}
            <button
              onClick={onOpenSettings}
              className="text-primary hover:underline"
            >
              افتح الإعدادات
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function SyntaxCard({
  icon,
  title,
  syntax,
  desc,
  mono,
}: {
  icon: React.ReactNode;
  title: string;
  syntax: string;
  desc: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/50 p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <code
        className={`block text-xs px-2 py-1 rounded bg-muted/60 ${
          mono ? "font-mono" : ""
        }`}
        dir="ltr"
      >
        {syntax}
      </code>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function PausePicker({
  onInsert,
}: {
  onInsert: (tag: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [duration, setDuration] = React.useState(0.5);
  const presets = [0.3, 0.5, 1, 1.5, 2, 3];

  const handleInsert = (secs: number) => {
    onInsert(makePauseTag(secs));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
        >
          <Pause className="h-3.5 w-3.5" />
          إيقاف مؤقت
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Pause className="h-3.5 w-3.5 text-primary" />
            مدة الإيقاف المؤقت
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => handleInsert(p)}
                className="rounded-md border border-border/50 px-2 py-1.5 text-xs hover:border-primary/50 hover:bg-accent/40 transition-colors font-mono"
              >
                {p}s
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">مخصّص</span>
              <span className="font-mono font-semibold">{duration.toFixed(2)}s</span>
            </div>
            <Slider
              dir="ltr"
              value={[duration]}
              min={0.01}
              max={5}
              step={0.01}
              onValueChange={(v) => setDuration(v[0])}
              aria-label="مدة الإيقاف المؤقت"
            />
            <Button
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => handleInsert(duration)}
            >
              إدراج <span className="font-mono">{makePauseTag(duration)}</span>
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            يجب تحديد المدة بالصيغة <code className="font-mono">&lt;#ثانية#&gt;</code>.
            متاح فقط لنموذج MiniMax Speech 2.8.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SoundTagPicker({
  onInsert,
}: {
  onInsert: (tag: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeCat, setActiveCat] = React.useState<SoundTagPreset["category"] | "all">("all");

  const filtered = React.useMemo(() => {
    return SOUND_TAG_PRESETS.filter((s) => {
      const matchCat = activeCat === "all" || s.category === activeCat;
      const matchQuery =
        !query ||
        s.tag.toLowerCase().includes(query.toLowerCase()) ||
        s.label.includes(query);
      return matchCat && matchQuery;
    });
  }, [query, activeCat]);

  const handleSelect = (tag: string) => {
    onInsert(tag);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
        >
          <Music2 className="h-3.5 w-3.5 text-violet-500" />
          مؤثر صوتي
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 p-0"
        onCloseAutoFocus={() => setQuery("")}
      >
        <div className="p-2 border-b border-border/60">
          <div className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن مؤثر..."
              className="h-8 text-xs"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1 p-2 border-b border-border/60">
          <button
            onClick={() => setActiveCat("all")}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
              activeCat === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border/60 hover:bg-accent/50"
            }`}
          >
            الكل
          </button>
          {SOUND_TAG_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setActiveCat(c.value)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                activeCat === c.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/60 hover:bg-accent/50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="max-h-56 overflow-y-auto p-2 scroll-area-custom">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              لا توجد نتائج
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {filtered.map((s) => (
                <button
                  key={s.tag}
                  onClick={() => handleSelect(s.tag)}
                  className="flex flex-col items-start gap-0.5 rounded-md border border-border/50 px-2 py-1.5 text-start hover:border-primary/50 hover:bg-accent/40 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    <span className="text-xs font-medium">{s.label}</span>
                    {s.official && (
                      <span className="text-[9px] px-1 py-px rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        رسمي
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono" dir="ltr">
                    {s.tag}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
