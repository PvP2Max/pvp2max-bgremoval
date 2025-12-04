import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";

const SERVICE_TOKEN = process.env.SERVICE_API_TOKEN;
const WITHOUTBG_API_URL = process.env.WITHOUTBG_API_URL;
const WITHOUTBG_API_TOKEN = process.env.WITHOUTBG_API_TOKEN;

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7);
  }

  const serviceHeader = request.headers.get("x-service-token");
  return serviceHeader ?? null;
}

async function readTextSafely(response: Response) {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return "no response body";
  }
}

export async function POST(request: NextRequest) {
  if (!SERVICE_TOKEN) {
    return NextResponse.json(
      { error: "Service token missing on server" },
      { status: 500 },
    );
  }

  const providedToken = extractToken(request);
  if (!providedToken || providedToken !== SERVICE_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Image file is required" },
      { status: 400 },
    );
  }

  if (!WITHOUTBG_API_URL) {
    return NextResponse.json(
      { error: "WITHOUTBG_API_URL not configured" },
      { status: 500 },
    );
  }

  const forwardForm = new FormData();
  forwardForm.append(
    "file",
    file,
    (file as File).name || "upload-from-bgremover.png",
  );

  const upstreamHeaders =
    WITHOUTBG_API_TOKEN && WITHOUTBG_API_TOKEN.length > 0
      ? { Authorization: `Bearer ${WITHOUTBG_API_TOKEN}` }
      : undefined;

  try {
    const upstreamResponse = await fetch(WITHOUTBG_API_URL, {
      method: "POST",
      headers: upstreamHeaders,
      body: forwardForm,
    });

    if (!upstreamResponse.ok) {
      const detail = await readTextSafely(upstreamResponse);
      return NextResponse.json(
        {
          error: "Background removal failed",
          detail,
        },
        { status: upstreamResponse.status },
      );
    }

    const arrayBuffer = await upstreamResponse.arrayBuffer();
    const contentType =
      upstreamResponse.headers.get("content-type") || "image/png";
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const json = NextResponse.json(
      {
        imageBase64: base64,
        contentType,
      },
      {
        // Prevent intermediaries from caching image payloads.
        headers: { "Cache-Control": "no-store" },
      },
    );
    return json;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Unexpected server error",
        detail: message,
      },
      { status: 500 },
    );
  }
}
