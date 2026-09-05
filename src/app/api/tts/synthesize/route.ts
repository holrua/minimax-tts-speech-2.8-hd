import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// مزود TTS غير مُعد حاليًا.
// عند إضافة مزود جديد يدعم معرّفات استنساخ الأصوات، استبدل هذا المسار
// بالاتصال بالمزود الجديد (راجع سجل git لإزالة Rewind.ai كمثال).
export async function POST() {
  return NextResponse.json(
    {
      error:
        "لا يوجد مزود TTS مُعد حاليًا. تمت إزالة Rewind.ai لأنها لا تدعم معرّفات استنساخ الأصوات (تتجاهلها وتستخدم صوتًا افتراضيًا). في انتظار مزود جديد يدعم استنساخ الصوت.",
    },
    { status: 503 },
  );
}
