import { NextRequest, NextResponse } from "next/server";
import { REWIND_BASE_URL, DEFAULT_TTS_MODEL } from "@/lib/rewind-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SynthesizeBody {
  apiKey?: string;
  text?: string;
  voice?: string;
  speed?: number;
  format?: "mp3" | "wav";
  model?: string;
}

interface RewindTtsResponse {
  audio_url?: string;
  format?: string;
  voice?: string;
  error?: { message?: string; code?: string; details?: { required?: number; available?: number } } | string;
  message?: string;
}

export async function POST(req: NextRequest) {
  let body: SynthesizeBody;
  try {
    body = (await req.json()) as SynthesizeBody;
  } catch {
    return NextResponse.json({ error: "جسم الطلب غير صالح." }, { status: 400 });
  }

  const apiKey = (body.apiKey || "").trim();
  const text = (body.text || "").trim();
  const voice = (body.voice || "af_heart").trim();
  const speed = typeof body.speed === "number" ? body.speed : 1;
  const format: "mp3" | "wav" = body.format === "wav" ? "wav" : "mp3";
  const model = (body.model || DEFAULT_TTS_MODEL).trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "لم يتم ضبط مفتاح API. افتح الإعدادات وأدخل مفتاح Rewind.ai الخاص بك.",
      },
      { status: 400 },
    );
  }
  if (!text) {
    return NextResponse.json(
      { error: "الرجاء إدخال النص المراد تحويله إلى صوت." },
      { status: 400 },
    );
  }
  if (Buffer.byteLength(text, "utf-8") > 50000) {
    return NextResponse.json(
      { error: "تجاوز النص الحد الأقصى المسموح (50,000 بايت)." },
      { status: 400 },
    );
  }

  // Rewind.ai: POST /v1/tts/ -> { audio_url, format, voice }
  const payload: Record<string, unknown> = {
    text,
    voice,
    speed,
    format,
    model,
  };

  try {
    // Retry on transient upstream errors with exponential backoff.
    const MAX_ATTEMPTS = 3;
    const BACKOFF_BASE_MS = 3000;
    let ttsJson: RewindTtsResponse | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await fetch(`${REWIND_BASE_URL}/v1/tts/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let json: RewindTtsResponse;
      try {
        json = (await res.json()) as RewindTtsResponse;
      } catch {
        const text = await res.text().catch(() => "");
        return NextResponse.json(
          {
            error: `فشل الاتصال بـ Rewind.ai (${res.status}). ${text.slice(0, 200)}`,
          },
          { status: 502 },
        );
      }

      if (res.ok && json.audio_url) {
        ttsJson = json;
        break;
      }

      // Extract error code + message
      const errorCode =
        typeof json.error === "object" && json.error ? json.error.code : "";
      let msg: string;
      if (typeof json.error === "string") msg = json.error;
      else if (json.error?.message) msg = json.error.message;
      else if (json.message) msg = json.message;
      else msg = `فشل التوليد على Rewind.ai (${res.status})`;

      // Insufficient tokens (quota exhausted) — clear actionable message.
      // HTTP 429 + INSUFFICIENT_TOKENS code.
      if (
        errorCode === "INSUFFICIENT_TOKENS" ||
        /insufficient tokens/i.test(msg) ||
        res.status === 429
      ) {
        const available =
          typeof json.error === "object" && json.error?.details?.available !== undefined
            ? json.error.details.available
            : null;
        const required =
          typeof json.error === "object" && json.error?.details?.required !== undefined
            ? json.error.details.required
            : null;
        const detail =
          available !== null && required !== null
            ? ` (مطلوب ${required}، متاح ${available})`
            : "";
        return NextResponse.json(
          {
            error:
              "رصيدك من الـ tokens على Rewind.ai قد نفد" +
              detail +
              ". اذهب إلى rewind.ai لإعادة شحن الرصيد، أو استخدم نصًا أقصر لتقليل عدد الـ tokens المطلوبة.",
          },
          { status: 402 },
        );
      }

      // Retry on transient capacity errors.
      if (
        /upstream capacity|temporarily exhausted|please retry later|timeout|503/i.test(
          msg,
        ) ||
        res.status === 503
      ) {
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, BACKOFF_BASE_MS * attempt));
          continue;
        }
        return NextResponse.json(
          {
            error:
              "خوادم Rewind.ai مستنزفة حالياً. هذه مشكلة مؤقتة — يرجى إعادة المحاولة بعد قليل. تمت 3 محاولات تلقائية وفشلت كلها.",
          },
          { status: 503 },
        );
      }

      // Non-retryable error: surface it.
      if (/invalid.*key|unauthor/i.test(msg)) {
        return NextResponse.json(
          { error: "مفتاح Rewind.ai غير صالح أو منتهي الصلاحية. تحقق من الإعدادات." },
          { status: 401 },
        );
      }
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    if (!ttsJson?.audio_url) {
      return NextResponse.json(
        { error: "لم يتم استلام رابط الصوت من Rewind.ai." },
        { status: 502 },
      );
    }

    // Download the audio from the hosted URL and base64-encode it for the client.
    const audioRes = await fetch(ttsJson.audio_url, { cache: "no-store" });
    if (!audioRes.ok) {
      return NextResponse.json(
        { error: `فشل تنزيل الصوت من Rewind.ai (${audioRes.status})` },
        { status: 502 },
      );
    }
    const buf = Buffer.from(await audioRes.arrayBuffer());
    let mimeType = audioRes.headers.get("content-type") || "";
    if (!mimeType.startsWith("audio/")) {
      mimeType = ttsJson.audio_url.toLowerCase().endsWith(".wav")
        ? "audio/wav"
        : "audio/mpeg";
    }
    const base64 = buf.toString("base64");

    return NextResponse.json({
      status: "completed",
      audio: { mimeType, base64 },
      audioUrl: ttsJson.audio_url,
      bytes: buf.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
