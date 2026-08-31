import { NextRequest, NextResponse } from "next/server";
import { GMICLOUD_BASE_URL } from "@/lib/gmicloud-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  const apiKey =
    req.headers.get("x-api-key") ||
    req.nextUrl.searchParams.get("apiKey") ||
    "";

  if (!requestId) {
    return NextResponse.json(
      { error: "معرّف الطلب مفقود." },
      { status: 400 },
    );
  }
  if (!apiKey) {
    return NextResponse.json(
      { error: "مفتاح API مفقود." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `${GMICLOUD_BASE_URL}/api/v1/ie/requestqueue/apikey/requests/${requestId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      },
    );

    let json: {
      request_id?: string;
      status?: "queued" | "processing" | "success" | "failed" | "cancelled";
      outcome?: {
        audio_url?: string;
        media_urls?: { id?: string; url?: string }[];
      };
      error?: { message?: string } | string;
      message?: string;
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
      let msg: string;
      if (typeof json.error === "string") msg = json.error;
      else if (json.error?.message) msg = json.error.message;
      else if (json.message) msg = json.message;
      else msg = `فشل قراءة الحالة (${res.status})`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const audioUrl =
      json.outcome?.audio_url || json.outcome?.media_urls?.[0]?.url;

    if (json.status === "success" && audioUrl) {
      // Download the audio and base64-encode it for the client.
      const audioRes = await fetch(audioUrl, { cache: "no-store" });
      if (!audioRes.ok) {
        return NextResponse.json(
          { error: `فشل تنزيل الصوت (${audioRes.status})` },
          { status: 502 },
        );
      }
      const buf = Buffer.from(await audioRes.arrayBuffer());
      let mimeType = audioRes.headers.get("content-type") || "";
      if (!mimeType.startsWith("audio/")) {
        mimeType = audioUrl.toLowerCase().endsWith(".flac")
          ? "audio/flac"
          : "audio/mpeg";
      }
      return NextResponse.json({
        requestId: json.request_id,
        status: "completed",
        audio: { mimeType, base64: buf.toString("base64") },
        audioUrl,
      });
    }

    return NextResponse.json({
      requestId: json.request_id,
      status: json.status || "processing",
      audio: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ غير متوقع.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
