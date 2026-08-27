import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const YEPAPI_BASE = "https://api.yepapi.com";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const apiKey =
    req.headers.get("x-api-key") ||
    req.nextUrl.searchParams.get("apiKey") ||
    "";

  if (!jobId) {
    return NextResponse.json({ error: "معرّف المهمة مفقود." }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "مفتاح API مفقود." }, { status: 400 });
  }

  try {
    const res = await fetch(`${YEPAPI_BASE}/v1/media/status/${jobId}`, {
      headers: { "x-api-key": apiKey },
      cache: "no-store",
    });

    let json: {
      data?: {
        status?: "pending" | "processing" | "completed" | "failed";
        result?: { audio?: { mimeType?: string; base64?: string } };
        error?: { message?: string };
      };
      error?: { message?: string };
    };
    try {
      json = await res.json();
    } catch {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `فشل قراءة الحالة (${res.status}). ${text.slice(0, 200)}` },
        { status: 502 },
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: json.error?.message || `فشل قراءة الحالة (${res.status})` },
        { status: 502 },
      );
    }

    const data = json.data;
    return NextResponse.json({
      jobId,
      status: data?.status || "pending",
      audio:
        data?.status === "completed"
          ? {
              mimeType: data?.result?.audio?.mimeType || "audio/mpeg",
              base64: data?.result?.audio?.base64 || "",
            }
          : null,
      error: data?.error?.message,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
