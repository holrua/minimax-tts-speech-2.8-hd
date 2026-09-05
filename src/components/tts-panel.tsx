"use client";

import * as React from "react";
import {
  AlertTriangle,
  ServerOff,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TtsPanelProps {
  onOpenSettings: () => void;
  onHistoryChange?: () => void;
  onVoicesChange?: () => void;
  refreshSignal?: number;
}

/**
 * لوحة تحويل النص إلى صوت.
 *
 * حاليًا لا يوجد مزود TTS مُعد — تمت إزالة Rewind.ai لأنها لا تدعم معرّفات
 * استنساخ الأصوات (تتجاهلها وتستخدم صوتًا افتراضيًا). في انتظار مزود جديد
 * يدعم استنساخ الصوت. عند توفر المزود الجديد، أعد بناء هذه اللوحة (راجع
 * سجل git لإزالة Rewind.ai كمثال على البنية السابقة).
 */
export function TtsPanel({
  onOpenSettings,
}: TtsPanelProps) {
  return (
    <div className="space-y-6">
      <Alert className="border-amber-500/40 bg-amber-500/5">
        <ServerOff className="h-5 w-5 text-amber-500" />
        <AlertTitle className="text-base">لا يوجد مزود TTS مُعد حاليًا</AlertTitle>
        <AlertDescription className="text-sm leading-relaxed space-y-2">
          <p>
            تمت إزالة مزود <strong>Rewind.ai</strong> مؤقتًا لأنه{" "}
            <strong>لا يدعم معرّفات استنساخ الأصوات</strong> (يتجاهلها ويستخدم
            صوتًا افتراضيًا). وُجد ذلك بعد تحليل صوتي: المخطط الطيفي للصوت
            المستنسخ مطابق لصوت <code dir="ltr">af_heart</code> الافتراضي، وليس
            الصوت المستنسخ المطلوب.
          </p>
          <p className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            في انتظار مزود جديد يدعم استنساخ الصوت بشكل فعلي.
          </p>
        </AlertDescription>
      </Alert>

      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-10 text-center">
        <ServerOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold mb-2">خدمة التوليد متوقفة مؤقتًا</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          لا يمكن توليد الصوت حاليًا لأنه لا يوجد مزود TTS مُعد. عند إضافة مزود
          جديد يدعم معرّفات استنساخ الأصوات، ستعود هذه اللوحة للعمل بكامل
          ميزاتها (تحويل النص، الأصوات، المشاعر، الإيقاف المؤقت، المؤثرات
          الصوتية، السجل).
        </p>

        <div className="mt-6 grid sm:grid-cols-2 gap-3 max-w-md mx-auto text-start">
          <div className="rounded-lg border border-border/50 bg-background/50 p-3">
            <p className="text-xs font-semibold mb-1">✅ الميزات المحفوظة</p>
            <ul className="text-[11px] text-muted-foreground space-y-0.5">
              <li>• استنساخ الصوت (تسجيل/رفع عينات)</li>
              <li>• سجل التوليد السابق (تشغيل/تنزيل)</li>
              <li>• الإعدادات (مفتاح API عند توفّر المزود)</li>
              <li>• الوضع الليلي/النهاري + RTL عربي</li>
            </ul>
          </div>
          <div className="rounded-lg border border-border/50 bg-background/50 p-3">
            <p className="text-xs font-semibold mb-1">⏸️ الميزات المتوقفة</p>
            <ul className="text-[11px] text-muted-foreground space-y-0.5">
              <li>• تحويل النص إلى صوت</li>
              <li>• اختيار الصوت والنموذج</li>
              <li>• المشاعر والإيقاف والمؤثرات</li>
              <li>• تنزيل الصوت المُولّد</li>
            </ul>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onOpenSettings}
          className="mt-6 gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          افتح الإعدادات
        </Button>
      </div>
    </div>
  );
}
