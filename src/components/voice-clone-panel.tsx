"use client";

import * as React from "react";
import {
  Upload,
  Mic,
  Square,
  Plus,
  Trash2,
  Play,
  Pause,
  AudioLines,
  Info,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  getCustomVoices,
  saveCustomVoice,
  deleteCustomVoice,
  uid,
  type CustomVoice,
} from "@/lib/storage";

interface VoiceClonePanelProps {
  onChanged?: () => void;
}

const SAMPLE_PROMPTS = [
  "مرحبًا، هذا صوتي المرجعي للاستنساخ.",
  "الذكاء الاصطناعي يغيّر طريقة تفاعلنا مع التكنولوجيا.",
  "أقرأ هذه الجمل بوضوح لأتمكن من استنساخ صوتي بدقة عالية.",
];

export function VoiceClonePanel({ onChanged }: VoiceClonePanelProps) {
  const { toast } = useToast();
  const [voices, setVoices] = React.useState<CustomVoice[]>([]);
  const [name, setName] = React.useState("");
  const [voiceId, setVoiceId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [sampleUrl, setSampleUrl] = React.useState<string | null>(null);
  const [sampleName, setSampleName] = React.useState<string>("");

  // Recording state
  const [recording, setRecording] = React.useState(false);
  const [recordedBlob, setRecordedBlob] = React.useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = React.useState<string | null>(null);
  const [recordSecs, setRecordSecs] = React.useState(0);
  const mediaRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const [previewPlaying, setPreviewPlaying] = React.useState<string | null>(null);
  const previewRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    setVoices(getCustomVoices());
  }, []);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const finalUrl = recordedUrl || sampleUrl;

  const handleFile = (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast({
        title: "ملف غير صالح",
        description: "الرجاء اختيار ملف صوتي.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({
        title: "حجم كبير",
        description: "الحد الأقصى 8 ميغابايت للعينة.",
        variant: "destructive",
      });
      return;
    }
    const url = URL.createObjectURL(file);
    setSampleUrl(url);
    setSampleName(file.name);
    // clear recording
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    toast({ title: "تم تحميل العينة", description: file.name });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setSampleName("تسجيل صوتي.wav");
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setRecording(true);
      setRecordSecs(0);
      timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch {
      toast({
        title: "تعذّر الوصول للمايك",
        description: "اسمح بالوصول إلى الميكروفون ثم حاول مجددًا.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const playPreview = (url: string) => {
    if (previewPlaying === url) {
      previewRef.current?.pause();
      setPreviewPlaying(null);
      return;
    }
    if (!previewRef.current) {
      previewRef.current = new Audio();
      previewRef.current.onended = () => setPreviewPlaying(null);
    }
    previewRef.current.pause();
    previewRef.current.src = url;
    previewRef.current.play().catch(() => {});
    setPreviewPlaying(url);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "اسم مطلوب",
        description: "أدخل اسمًا للصوت المستنسخ.",
        variant: "destructive",
      });
      return;
    }
    const id = voiceId.trim() || `cloned_${uid("v")}`;
    if (!finalUrl) {
      toast({
        title: "عينة مطلوبة",
        description: "حمّل ملفًا صوتيًا أو سجّل عينة صوتك.",
        variant: "destructive",
      });
      return;
    }

    // Convert sample to data URL for persistence (capped size handled by upload limit)
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : undefined;
      const v: CustomVoice = {
        id,
        name: name.trim(),
        description: description.trim() || "صوت مستنسخ بواسطة المستخدم",
        sampleDataUrl: dataUrl,
        sampleName,
        createdAt: Date.now(),
      };
      saveCustomVoice(v);
      setVoices(getCustomVoices());
      onChanged?.();
      // reset
      setName("");
      setVoiceId("");
      setDescription("");
      setSampleUrl(null);
      setSampleName("");
      setRecordedBlob(null);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
      toast({
        title: "تم حفظ الصوت",
        description: `يمكنك الآن استخدام "${v.name}" في قسم تحويل النص.`,
      });
    };
    if (recordedBlob) reader.readAsDataURL(recordedBlob);
    else if (sampleUrl) {
      // fetch the object URL and convert
      fetch(sampleUrl)
        .then((r) => r.blob())
        .then((b) => reader.readAsDataURL(b));
    }
  };

  const handleDelete = (id: string) => {
    deleteCustomVoice(id);
    setVoices(getCustomVoices());
    onChanged?.();
    toast({ title: "تم حذف الصوت" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: create form */}
      <div className="space-y-5">
        <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center gap-2">
              <AudioLines className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">إنشاء صوت جديد</h3>
            </div>

            {/* Upload or record */}
            <div className="space-y-3">
              <Label className="text-sm">عينة الصوت</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/70 p-5 cursor-pointer hover:border-primary hover:bg-accent/40 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs font-medium">رفع ملف صوتي</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                      e.target.value = "";
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={recording ? stopRecording : startRecording}
                  className={
                    "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 transition-colors " +
                    (recording
                      ? "border-destructive bg-destructive/10 pulse-ring"
                      : "border-border/70 hover:border-primary hover:bg-accent/40")
                  }
                >
                  {recording ? (
                    <>
                      <Square className="h-5 w-5 text-destructive fill-current" />
                      <span className="text-xs font-mono text-destructive">
                        {String(Math.floor(recordSecs / 60)).padStart(2, "0")}:
                        {String(recordSecs % 60).padStart(2, "0")}
                      </span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs font-medium">تسجيل من المايك</span>
                    </>
                  )}
                </button>
              </div>

              {finalUrl && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 rounded-full shrink-0"
                    onClick={() => playPreview(finalUrl)}
                  >
                    {previewPlaying === finalUrl ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sampleName}</p>
                    <p className="text-xs text-muted-foreground">عينة جاهزة</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <Headphones className="h-3 w-3 ms-1" /> مرجعي
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm">اسم الصوت</Label>
              <Input
                dir="rtl"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: صوتي الشخصي"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">
                معرّف الصوت (اختياري)
              </Label>
              <Input
                dir="ltr"
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                placeholder="يُولّد تلقائيًا إن تُرك فارغًا"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                إذا كان لديك معرّف صوت مستنسخ من MiniMax، أدخله هنا لربطه بهذا الملف.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">الوصف (اختياري)</Label>
              <Textarea
                dir="auto"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف موجز لهذا الصوت..."
                className="min-h-[70px] resize-y"
              />
            </div>

            <Button onClick={handleSave} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              حفظ الصوت المستنسخ
            </Button>
          </CardContent>
        </Card>

        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle>كيف يعمل استنساخ الصوت؟</AlertTitle>
          <AlertDescription className="text-sm leading-relaxed">
            ارفع أو سجّل عينة صوتية واضحة (10–30 ثانية)، ثم احفظها كملف صوت.
            يمكنك استخدام المعرّف الناتج في قسم تحويل النص إلى صوت. للاستنساخ
            الكامل على خوادم MiniMax، استخدم واجهة استنساخ MiniMax للحصول على
            معرّف صوت ثم سجّله هنا.
          </AlertDescription>
        </Alert>
      </div>

      {/* Right: saved voices */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <AudioLines className="h-5 w-5 text-primary" />
            أصواتي المحفوظة
          </h3>
          <Badge variant="secondary">{voices.length}</Badge>
        </div>

        {voices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
            <AudioLines className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">لا توجد أصوات محفوظة بعد.</p>
            <p className="text-xs mt-1">ابدأ بإنشاء صوت جديد من اليسار.</p>
          </div>
        ) : (
          <ScrollArea className="h-[480px] rounded-xl border border-border/40 p-1 scroll-area-custom">
            <div className="space-y-3 p-2">
              {voices.map((v) => (
                <Card
                  key={v.id}
                  className="border-border/60 bg-card/50 backdrop-blur-sm"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{v.name}</p>
                        <p
                          className="text-xs text-muted-foreground font-mono truncate"
                          dir="ltr"
                        >
                          {v.id}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                        onClick={() => handleDelete(v.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {v.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {v.description}
                      </p>
                    )}
                    {v.sampleDataUrl && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-2"
                          onClick={() => playPreview(v.sampleDataUrl!)}
                        >
                          {previewPlaying === v.sampleDataUrl ? (
                            <>
                              <Pause className="h-3.5 w-3.5" /> إيقاف
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5" /> استماع
                            </>
                          )}
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {v.sampleName}
                        </span>
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground/70">
                      {new Date(v.createdAt).toLocaleString("ar-EG")}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-xs font-semibold mb-2">نص مقترح للتسجيل:</p>
          <ScrollArea className="h-24 scroll-area-custom">
            <div className="space-y-1.5">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    navigator.clipboard?.writeText(p).catch(() => {});
                    toast({ title: "تم النسخ" });
                  }}
                  className="block w-full text-start text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded p-1.5 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
