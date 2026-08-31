import { NextRequest, NextResponse } from "next/server";
import { GMICLOUD_BASE_URL, DEFAULT_TTS_MODEL, POLL_INTERVAL_MS, POLL_TIMEOUT_MS } from "@/lib/gmicloud-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SynthesizeBody {
  apiKey?: string;
  text?: string;
  voiceId?: string;
  speed?: number;
  vol?: number;
  pitch?: number;
  emotion?: string;
  languageBoost?: string;
  format?: "mp3" | "flac";
  audioSampleRate?: string;
  bitrate?: string;
  channel?: string;
  vmPitch?: number;
  intensity?: number;
  timbre?: number;
  soundEffects?: string;
  model?: string;
}

interface GmiSubmitResponse {
  request_id?: string;
  status?: string;
  error?: { message?: string } | string;
  message?: string;
}

interface GmiStatusResponse {
  request_id?: string;
  status?: "queued" | "processing" | "success" | "failed" | "cancelled";
  outcome?: {
    audio_url?: string;
    media_urls?: { id?: string; url?: string }[];
    format?: string;
    status?: string;
  };
  error?: { message?: string } | string;
  message?: string;
}

async function submitJob(params: {
  apiKey: string;
  model: string;
  payload: Record<string, unknown>;
}): Promise<string> {
  // Retry on transient upstream capacity errors ("Upstream capacity
  // temporarily exhausted; please retry later") with exponential backoff.
  const MAX_ATTEMPTS = 4;
  const BACKOFF_BASE_MS = 3000;
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(
      `${GMICLOUD_BASE_URL}/api/v1/ie/requestqueue/apikey/requests`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: params.model, payload: params.payload }),
      },
    );

    let json: GmiSubmitResponse;
    try {
      json = (await res.json()) as GmiSubmitResponse;
    } catch {
      const text = await res.text().catch(() => "");
      throw new Error(`فشل إرسال المهمة (${res.status}). ${text.slice(0, 200)}`);
    }

    if (res.ok && json.request_id) {
      return json.request_id;
    }

    // Extract error message
    let msg: string;
    if (typeof json.error === "string") msg = json.error;
    else if (json.error?.message) msg = json.error.message;
    else if (json.message) msg = json.message;
    else msg = `فشل إرسال المهمة إلى GMICloud (${res.status})`;
    lastError = msg;

    // If it's a transient capacity issue, retry after a backoff.
    if (/upstream capacity|temporarily exhausted|please retry later/i.test(msg)) {
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) =>
          setTimeout(r, BACKOFF_BASE_MS * attempt),
        );
        continue;
      }
      // Final attempt: surface a clear Arabic message.
      throw new Error(
        "خوادم MiniMax المنبع مستنزفة حالياً (Upstream capacity exhausted). " +
          "هذه مشكلة مؤقتة من جهة GMICloud يرجى إعادة المحاولة بعد دقيقة. " +
          "تمت 4 محاولات تلقائية وفشلت كلها.",
      );
    }

    // Non-retryable error: translate the common ones and throw.
    if (/no access to this voice_id|don't have access to this voice|voice_id.*not.*found/i.test(msg)) {
      throw new Error(
        "لا يمكن استخدام هذا الصوت (voice_id). معرّفات الأصوات المستنسخة تخص حساب المُنشئ فقط — " +
          "لا يمكنك استخدام صوت مستنسخ من حساب آخر. جرّب صوتًا من القائمة (مثل «امرأة هادئة») " +
          "أو استنسخ صوتًا جديدًا على حسابك وأدخل معرّفه في قسم «معرّف مخصص».",
      );
    }
    if (/invalid voice_id|voice_id.*invalid|voice id wrong/i.test(msg)) {
      throw new Error(
        "معرّف الصوت غير صالح (voice id wrong). اختر صوتًا من القائمة أو تأكد من صحة المعرّف المخصص.",
      );
    }
    throw new Error(msg);
  }

  throw new Error(lastError || "فشل إرسال المهمة.");
}

async function pollStatus(
  requestId: string,
  apiKey: string,
): Promise<GmiStatusResponse> {
  const res = await fetch(
    `${GMICLOUD_BASE_URL}/api/v1/ie/requestqueue/apikey/requests/${requestId}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    },
  );

  let json: GmiStatusResponse;
  try {
    json = (await res.json()) as GmiStatusResponse;
  } catch {
    const text = await res.text().catch(() => "");
    throw new Error(`فشل قراءة حالة المهمة (${res.status}). ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    let msg: string;
    if (typeof json.error === "string") msg = json.error;
    else if (json.error?.message) msg = json.error.message;
    else if (json.message) msg = json.message;
    else msg = `فشل قراءة حالة المهمة (${res.status})`;
    throw new Error(msg);
  }
  return json;
}

async function fetchAudioToBase64(url: string): Promise<{
  base64: string;
  mimeType: string;
}> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`فشل تنزيل الصوت من GMICloud (${res.status})`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "";
  let mimeType = ct;
  if (!mimeType.startsWith("audio/")) {
    // Fall back to guessing from URL extension.
    mimeType = url.toLowerCase().endsWith(".flac") ? "audio/flac" : "audio/mpeg";
  }
  return { base64: buf.toString("base64"), mimeType };
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
  const voiceId = (body.voiceId || "Arabic_CalmWoman").trim();
  const model = (body.model || DEFAULT_TTS_MODEL).trim();
  const speed = typeof body.speed === "number" ? body.speed : 1;
  const vol = typeof body.vol === "number" ? body.vol : 1;
  const pitch = typeof body.pitch === "number" ? body.pitch : 0;
  const emotion = (body.emotion || "auto").trim();
  const languageBoost = (body.languageBoost || "auto").trim();
  const format = body.format === "flac" ? "flac" : "mp3";
  const audioSampleRate = (body.audioSampleRate || "32000").trim();
  const bitrate = (body.bitrate || "128000").trim();
  const channel = body.channel === "1" ? "1" : "2";
  const vmPitch = typeof body.vmPitch === "number" ? body.vmPitch : 0;
  const intensity = typeof body.intensity === "number" ? body.intensity : 0;
  const timbre = typeof body.timbre === "number" ? body.timbre : 0;
  const soundEffects = (body.soundEffects || "").trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "لم يتم ضبط مفتاح API. افتح الإعدادات وأدخل مفتاح GMICloud الخاص بك.",
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

  // GMICloud expects the payload nested under `payload`. Note that many fields
  // are strings (even numeric ones) per the API spec.
  const payload: Record<string, unknown> = {
    text,
    voice_id: voiceId,
    speed: String(speed),
    vol: String(vol),
    pitch,
    emotion,
    language_boost: languageBoost,
    format,
    audio_sample_rate: audioSampleRate,
    bitrate,
    channel,
    vm_pitch: vmPitch,
    intensity,
    timbre,
    sound_effects: soundEffects,
  };

  try {
    const requestId = await submitJob({ apiKey, model, payload });

    // Poll until success, failure, or timeout.
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    let attempt = 0;
    let lastStatus = "queued";

    while (Date.now() < deadline) {
      attempt += 1;
      const data = await pollStatus(requestId, apiKey);
      lastStatus = data.status || lastStatus;

      if (data.status === "success") {
        const audioUrl =
          data.outcome?.audio_url || data.outcome?.media_urls?.[0]?.url;
        if (!audioUrl) {
          return NextResponse.json(
            { error: "اكتملت المهمة لكن لم يتم العثور على رابط الصوت." },
            { status: 502 },
          );
        }
        const { base64, mimeType } = await fetchAudioToBase64(audioUrl);
        return NextResponse.json({
          requestId,
          status: "completed",
          audio: { mimeType, base64 },
          audioUrl,
        });
      }

      if (data.status === "failed" || data.status === "cancelled") {
        let msg: string;
        if (typeof data.error === "string") msg = data.error;
        else if (data.error?.message) msg = data.error.message;
        else if (data.message) msg = data.message;
        else msg = `فشلت المهمة على GMICloud (الحالة: ${data.status}).`;
        return NextResponse.json(
          { error: msg, requestId, status: data.status },
          { status: 502 },
        );
      }

      await new Promise((r) =>
        setTimeout(r, Math.min(POLL_INTERVAL_MS, 2500 + attempt * 200)),
      );
    }

    // Timed out — return the request id so the client can keep polling.
    return NextResponse.json(
      {
        requestId,
        status: lastStatus,
        error: "المهمة لا تزال قيد المعالجة. يمكنك متابعة الاستعلام عنها.",
        timeout: true,
      },
      { status: 202 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
