"use client";

import * as React from "react";
import { Sparkles, Loader2, AlertTriangle, Settings2, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AudioPlayer } from "@/components/audio-player";
import { useToast } from "@/hooks/use-toast";
import {
  getApiKey,
  getSettings,
  addHistory,
  utf8ByteLength,
  estimateCost,
  uid,
  getCustomVoices,
  type HistoryItem,
} from "@/lib/storage";
import { VOICE_PRESETS, VOICE_CATEGORIES, type VoiceCategory } from "@/lib/voices";

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
  const [voice, setVoice] = React.useState("English_expressive_narrator");
  const [category, setCategory] = React.useState<VoiceCategory>("english");
  const [speed, setSpeed] = React.useState(1);
  const [format, setFormat] = React.useState<"mp3" | "pcm">("mp3");
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

  // Load settings once on mount and when refresh signal changes
  React.useEffect(() => {
    const s = getSettings();
    setVoice(s.defaultVoice);
    setSpeed(s.speed);
    setFormat(s.outputFormat);
    setHasKey(!!getApiKey());
    setCustomVoicesState(getCustomVoices().map((v) => ({ id: v.id, name: v.name })));
  }, [refreshSignal]);

  React.useEffect(() => {
    onVoicesChange?.();
  }, [customVoices, onVoicesChange]);

  const byteLen = utf8ByteLength(text);
  const cost = estimateCost(byteLen);
  const overLimit = byteLen > 50000;

  const filteredVoices = VOICE_PRESETS.filter((v) => v.category === category);

  const generate = async () => {
    setError(null);
    setResultSrc(null);
    const key = getApiKey();
    if (!key) {
      setHasKey(false);
      toast({
        title: "مفتاح API مفقود",
        description: "افتح الإعدادات وأدخل مفتاح YepAPI أولًا.",
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
    const finalVoice = (useCustomId ? customId.trim() : voice) || "English_expressive_narrator";

    setLoading(true);
    try {
      const res = await fetch("/api/tts/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: key,
          prompt: text,
          voice: finalVoice,
          speed,
          outputFormat: format,
          model: getSettings().model,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.audio?.base64) {
        const msg = data?.error || `فشل التوليد (${res.status})`;
        setError(msg);
        toast({ title: "فشل التوليد", description: msg, variant: "destructive" });
        return;
      }
      const mime = data.audio.mimeType || (format === "pcm" ? "audio/pcm" : "audio/mpeg");
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
      {/* Left: text input */}
      <div className="lg:col-span-3 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="tts-text" className="text-base font-semibold">
              النص المراد تحويله إلى صوت
            </Label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
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
          <Textarea
            id="tts-text"
            dir="auto"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب أو الصق النص هنا... يدعم اللغات المتعددة."
            className="min-h-[260px] resize-y text-base leading-relaxed scroll-area-custom"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>الحد الأقصى: 50,000 بايت</span>
            <span>يُحتسب التكلفة تلقائيًا حسب حجم النص</span>
          </div>
        </div>

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
              <Label className="text-sm">معرّف صوت MiniMax</Label>
              <input
                dir="ltr"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="مثال: cloned_voice_abc123"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                يدعم النموذج أي معرّف صوت MiniMax. استخدم معرّف صوت مستنسخ من
                قسم استنساخ الصوت.
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
              onValueChange={(v) => v && setFormat(v as "mp3" | "pcm")}
              className="w-full justify-start gap-2"
            >
              <ToggleGroupItem value="mp3" className="flex-1 text-xs">
                MP3
              </ToggleGroupItem>
              <ToggleGroupItem value="pcm" className="flex-1 text-xs">
                PCM
              </ToggleGroupItem>
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
