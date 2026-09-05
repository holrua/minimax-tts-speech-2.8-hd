"use client";

import * as React from "react";
import {
  KeyRound,
  Clock,
  ServerOff,
  ShieldCheck,
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
import { Badge } from "@/components/ui/badge";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

/**
 * نافذة الإعدادات.
 *
 * حاليًا لا يوجد مزود TTS مُعد — تمت إزالة Rewind.ai. عند إضافة مزود جديد
 * يدعم استنساخ الأصوات، أعد بناء هذه النافذة لتشمل حقل إدخال مفتاح المزود
 * وخيارات النموذج (راجع سجل git لإزالة Rewind.ai كمثال على البنية السابقة).
 */
export function SettingsDialog({
  open,
  onOpenChange,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <KeyRound className="h-5 w-5 text-primary" />
            الإعدادات
          </DialogTitle>
          <DialogDescription>
            إدارة مفاتيح API وإعدادات التوليد — كل البيانات تُحفظ في متصفحك فقط.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Provider status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">مزود TTS</span>
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
                <Clock className="h-3.5 w-3.5 ms-1" /> غير مُعد
              </Badge>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <ServerOff className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-sm space-y-1.5">
                  <p className="font-semibold">في انتظار مزود جديد</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    تمت إزالة <strong>Rewind.ai</strong> لأنها{" "}
                    <strong>لا تدعم معرّفات استنساخ الأصوات</strong> — تتجاهلها
                    وتستخدم صوتًا افتراضيًا. عند توفّر مزود جديد يدعم استنساخ
                    الصوت بشكل فعلي، ستظهر هنا خانة إدخال المفتاح وقائمة النماذج
                    والأصوات.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy note */}
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground mb-1">الخصوصية</p>
                عند تفعيل المزود الجديد، سيُحفظ مفتاح API في متصفحك فقط
                (localStorage) — لا حسابات ولا تسجيل دخول، ولا يُرسل المفتاح
                إلا إلى خوادم المزود عبر واجهتنا الخلفية.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
