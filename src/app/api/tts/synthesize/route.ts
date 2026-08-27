import { NextRequest, NextResponse } from "next/server";
import { getModel, DEFAULT_TTS_MODEL } from "@/lib/chinaapi-models";
import { EMOTION_DIRECTIONS } from "@/lib/minimax-tags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHINAAPI_BASE = "https://api.chinaapi.ai/v1";

interface SynthesizeBody {
  apiKey?: string;
  input?: string;
  voice?: string;
  speed?: number;
  responseFormat?: "mp3" | "wav" | "opus" | "flac" | "pcm";
  model?: string;
  emotion?: string;
  instructions?: string;
}

export async function POST(req: NextRequest) {
  let body: SynthesizeBody;
  try {
    body = (await req.json()) as SynthesizeBody;
  } catch {
    return NextResponse.json(
      { error: "جسم الطلب غير صالح." },
      { status: 400 },
    );
  }

  const apiKey = (body.apiKey || "").trim();
  const input = (body.input || "").trim();
  const voice = (body.voice || "Arabic_CalmWoman").trim();
  const speed = typeof body.speed === "number" ? body.speed : 1;
  const responseFormat =
    (body.responseFormat as "mp3" | "wav" | "opus" | "flac" | "pcm") || "mp3";
  let model = (body.model || DEFAULT_TTS_MODEL).trim();
  const emotion = (body.emotion || "").trim();
  const instructions = (body.instructions || "").trim();

  // Normalize: strip a stale "minimax/" or "openai/" prefix, then validate.
  // e.g. "minimax/speech-2.8-hd" (old YepAPI id) -> "speech-2.8-hd".
  if (model.includes("/") && !getModel(model)) {
    const suffix = model.split("/").pop();
    if (suffix && getModel(suffix)) model = suffix;
  }
  // If still invalid, fall back to the default model so the request keeps working.
  if (!getModel(model)) model = DEFAULT_TTS_MODEL;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "لم يتم ضبط مفتاح API. افتح الإعدادات وأدخل مفتاح ChinaAPI الخاص بك.",
      },
      { status: 400 },
    );
  }
  if (!input) {
    return NextResponse.json(
      { error: "الرجاء إدخال النص المراد تحويله إلى صوت." },
      { status: 400 },
    );
  }
  if (Buffer.byteLength(input, "utf-8") > 50000) {
    return NextResponse.json(
      { error: "تجاوز النص الحد الأقصى المسموح (50,000 بايت)." },
      { status: 400 },
    );
  }

  // Build the OpenAI-compatible request body.
  // ChinaAPI: { model, input, voice, response_format, speed, instructions, voice_setting }
  const payload: Record<string, unknown> = {
    model,
    input,
    voice,
    response_format: responseFormat,
    speed,
  };
  // Emotion: verified empirically that ChinaAPI forwards BOTH:
  //   1. `voice_setting.emotion` (native MiniMax shape) — produces the
  //      strongest, most reliable emotional delivery.
  //   2. `instructions: "emotion: <value>"` — also honoured by the gateway.
  // We send both so the emotion lands even if only one path is active upstream.
  const emotionDirections: string[] = [];
  if (emotion && emotion !== "auto") {
    const brief = EMOTION_DIRECTIONS[emotion] || emotion;
    emotionDirections.push(`emotion: ${brief}`);
    payload.voice_setting = { emotion: brief };
    payload.emotion = brief; // best-effort top-level passthrough
  }
  if (instructions) {
    emotionDirections.push(instructions);
  }
  if (emotionDirections.length > 0) {
    payload.instructions = emotionDirections.join("; ");
  }

  try {
    const res = await fetch(`${CHINAAPI_BASE}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // ChinaAPI returns the audio bytes directly (Content-Type: audio/mpeg).
    // On error it returns JSON.
    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
      let msg: string;
      if (contentType.includes("application/json")) {
        try {
          const errJson = (await res.json()) as {
            error?: { message?: string } | string;
            message?: string;
          };
          if (typeof errJson.error === "string") msg = errJson.error;
          else if (errJson.error?.message) msg = errJson.error.message;
          else if (errJson.message) msg = errJson.message;
          else msg = JSON.stringify(errJson);
        } catch {
          msg = `فشل التوليد (${res.status})`;
        }
      } else {
        const text = await res.text().catch(() => "");
        msg = text.slice(0, 300) || `فشل التوليد (${res.status})`;
      }
      // Translate the most common ChinaAPI upstream errors into clear guidance.
      if (/no available channel/i.test(msg)) {
        msg =
          `لا توجد قناة متاحة لهذا النموذج (${model}). قد يكون معرّف النموذج غير صحيح أو غير مفعّل لحسابك. ` +
          `جرّب نموذجًا آخر من القائمة (مثل speech-2.8-hd).`;
      } else if (/model not found|invalid model|unknown model/i.test(msg)) {
        msg = `النموذج "${model}" غير معروف على ChinaAPI. اختر نموذجًا من القائمة.`;
      }
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    if (!contentType.startsWith("audio/")) {
      // Not the expected binary response
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        {
          error:
            "استجابة غير متوقعة من ChinaAPI. تحقق من المفتاح والنموذج. " +
            text.slice(0, 200),
        },
        { status: 502 },
      );
    }

    // Read binary audio and base64-encode for the client
    const audioBuffer = Buffer.from(await res.arrayBuffer());
    const base64 = audioBuffer.toString("base64");
    const mimeType = contentType;

    return NextResponse.json({
      status: "completed",
      audio: {
        mimeType,
        base64,
      },
      bytes: audioBuffer.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
