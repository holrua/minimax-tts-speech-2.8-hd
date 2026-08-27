import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const YEPAPI_BASE = "https://api.yepapi.com";

interface SynthesizeBody {
  apiKey?: string;
  prompt?: string;
  voice?: string;
  speed?: number;
  outputFormat?: "mp3" | "pcm";
  model?: string;
}

interface YepJobResponse {
  data?: { jobId?: string };
  error?: { message?: string; code?: string };
}

interface YepStatusResponse {
  data?: {
    status?: "pending" | "processing" | "completed" | "failed";
    result?: {
      audio?: { mimeType?: string; base64?: string };
    };
    error?: { message?: string };
  };
  error?: { message?: string };
}

async function submitJob(params: {
  apiKey: string;
  model: string;
  prompt: string;
  voice: string;
  speed: number;
  outputFormat: string;
}): Promise<string> {
  const res = await fetch(`${YEPAPI_BASE}/v1/media/queue`, {
    method: "POST",
    headers: {
      "x-api-key": params.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      prompt: params.prompt,
      options: {
        voice: params.voice,
        outputFormat: params.outputFormat,
        speed: params.speed,
      },
    }),
  });

  let json: YepJobResponse;
  try {
    json = (await res.json()) as YepJobResponse;
  } catch {
    const text = await res.text().catch(() => "");
    throw new Error(
      `فشل إرسال المهمة (${res.status}). ${text.slice(0, 200)}`,
    );
  }

  if (!res.ok || !json.data?.jobId) {
    const msg =
      json.error?.message ||
      `فشل إرسال المهمة إلى YepAPI (${res.status})`;
    throw new Error(msg);
  }
  return json.data.jobId;
}

async function pollStatus(
  jobId: string,
  apiKey: string,
): Promise<YepStatusResponse["data"]> {
  const res = await fetch(`${YEPAPI_BASE}/v1/media/status/${jobId}`, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });

  let json: YepStatusResponse;
  try {
    json = (await res.json()) as YepStatusResponse;
  } catch {
    const text = await res.text().catch(() => "");
    throw new Error(`فشل قراءة حالة المهمة (${res.status}). ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(
      json.error?.message || `فشل قراءة حالة المهمة (${res.status})`,
    );
  }
  return json.data;
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
  const prompt = (body.prompt || "").trim();
  const voice = (body.voice || "English_expressive_narrator").trim();
  const speed = typeof body.speed === "number" ? body.speed : 1;
  const outputFormat = body.outputFormat === "pcm" ? "pcm" : "mp3";
  const model = (body.model || "minimax/speech-2.8-hd").trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "لم يتم ضبط مفتاح API. افتح الإعدادات وأدخل مفتاح YepAPI الخاص بك.",
      },
      { status: 400 },
    );
  }
  if (!prompt) {
    return NextResponse.json(
      { error: "الرجاء إدخال النص المراد تحويله إلى صوت." },
      { status: 400 },
    );
  }
  if (Buffer.byteLength(prompt, "utf-8") > 50000) {
    return NextResponse.json(
      { error: "تجاوز النص الحد الأقصى المسموح (50,000 بايت)." },
      { status: 400 },
    );
  }

  try {
    const jobId = await submitJob({
      apiKey,
      model,
      prompt,
      voice,
      speed,
      outputFormat,
    });

    // Poll until done or timeout (~90s)
    const deadline = Date.now() + 90_000;
    let lastStatus: string = "pending";
    let attempt = 0;

    while (Date.now() < deadline) {
      attempt += 1;
      const data = await pollStatus(jobId, apiKey);
      lastStatus = data?.status || lastStatus;

      if (data?.status === "completed") {
        const audio = data?.result?.audio;
        if (!audio?.base64) {
          return NextResponse.json(
            { error: "اكتملت المهمة لكن لم يتم استلام الصوت." },
            { status: 502 },
          );
        }
        return NextResponse.json({
          jobId,
          status: "completed",
          audio: {
            mimeType:
              audio.mimeType ||
              (outputFormat === "pcm" ? "audio/pcm" : "audio/mpeg"),
            base64: audio.base64,
          },
        });
      }

      if (data?.status === "failed") {
        return NextResponse.json(
          {
            error:
              data?.error?.message || "فشلت المهمة على YepAPI.",
            jobId,
            status: "failed",
          },
          { status: 502 },
        );
      }

      // Exponential-ish backoff capped at ~1.8s
      await new Promise((r) =>
        setTimeout(r, Math.min(1800, 600 + attempt * 200)),
      );
    }

    // Timed out — return jobId so the client can continue polling
    return NextResponse.json(
      {
        jobId,
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
