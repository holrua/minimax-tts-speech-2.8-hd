"use client";

import * as React from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  getApiKey,
  setApiKey,
  clearApiKey,
  getSettings,
  setSettings,
  type AppSettings,
} from "@/lib/storage";
import { VOICE_PRESETS } from "@/lib/voices";
import { TTS_MODELS } from "@/lib/gmicloud-models";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  onSaved,
}: SettingsDialogProps) {
  const { toast } = useToast();
  const [keyInput, setKeyInput] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);
  const [hasKey, setHasKey] = React.useState(false);
  const [settings, setLocalSettings] = React.useState<AppSettings | null>(null);

  React.useEffect(() => {
    if (open) {
      setKeyInput(getApiKey());
      setHasKey(!!getApiKey());
      setLocalSettings(getSettings());
      setShowKey(false);
    }
  }, [open]);

  const handleSave = () => {
    const trimmed = keyInput.trim();
    if (trimmed && !trimmed.startsWith("eyJ")) {
      toast({
        title: "تنبيه",
        description: "مفتاح GMICloud عبارة عن رمز JWT يبدأ عادةً بـ eyJ . تأكد من صحة المفتاح.",
        variant: "destructive",
      });
    }
    setApiKey(trimmed);
    setHasKey(!!trimmed);
    if (settings) setSettings(settings);
    toast({
      title: "تم الحفظ",
      description: "تم حفظ الإعدادات محليًا في متصفحك.",
    });
    onSaved?.();
    onOpenChange(false);
  };

  const handleClear = () => {
    clearApiKey();
    setKeyInput("");
    setHasKey(false);
    toast({ title: "تم حذف المفتاح" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <KeyRound className="h-5 w-5 text-primary" />
            الإعدادات ومفاتيح API
          </DialogTitle>
          <DialogDescription>
            تُحفظ كل البيانات في متصفحك فقط — لا يوجد تسجيل دخول ولا حساب.
            مفتاحك لا يُرسل إلا إلى خوادم GMICloud عبر واجهتنا الخلفية.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* API key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="apikey" className="text-base font-semibold">
                مفتاح GMICloud
              </Label>
              {hasKey ? (
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  <CheckCircle2 className="h-3.5 w-3.5 ms-1" /> مُفعّل
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-amber-600 dark:text-amber-400">
                  غير مُعدّ
                </Badge>
              )}
            </div>
            <div className="relative">
              <Input
                id="apikey"
                type={showKey ? "text" : "password"}
                dir="ltr"
                placeholder="eyJhbGciOi..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="pe-10 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute inset-y-0 end-2 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={showKey ? "إخفاء المفتاح" : "إظهار المفتاح"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              احصل على مفتاحك من لوحة تحكم GMICloud ثم الصقه هنا. يُستخدم المفتاح
              لتوقيع طلبات تحويل النص إلى صوت.
            </p>
            <a
              href="https://console.gmicloud.ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              لوحة تحكم GMICloud <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <Separator />

          {/* Default settings */}
          {settings && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground">
                الإعدادات الافتراضية
              </h4>

              <div className="space-y-2">
                <Label className="text-sm">الصوت الافتراضي</Label>
                <Select
                  dir="rtl"
                  value={settings.defaultVoice}
                  onValueChange={(v) =>
                    setLocalSettings({ ...settings, defaultVoice: v })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر صوتًا" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {VOICE_PRESETS.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        <span className="flex flex-col">
                          <span>{v.label}</span>
                          <span className="text-xs text-muted-foreground" dir="ltr">
                            {v.id}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">نموذج TTS</Label>
                <Select
                  dir="rtl"
                  value={settings.model}
                  onValueChange={(v) =>
                    setLocalSettings({ ...settings, model: v })
                  }
                >
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
                  const m = TTS_MODELS.find((x) => x.id === settings.model);
                  return m ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {m.description}
                    </p>
                  ) : null;
                })()}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {hasKey && (
            <Button
              variant="ghost"
              onClick={handleClear}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 ms-1" />
              حذف المفتاح
            </Button>
          )}
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
