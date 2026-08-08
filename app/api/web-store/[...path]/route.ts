import { NextRequest, NextResponse } from "next/server";

import { careApiBaseUrl } from "@/lib/web-store/utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, ctx: Ctx) {
  const base = careApiBaseUrl();
  if (!base) {
    return NextResponse.json(
      {
        error: "api_not_configured",
        message: "Falta NEXT_PUBLIC_CARE_API_BASE_URL.",
      },
      { status: 503 },
    );
  }

  const { path } = await ctx.params;
  const suffix = (path ?? []).map(encodeURIComponent).join("/");
  const incoming = new URL(req.url);
  const target = `${base}/public/web-store/${suffix}${incoming.search}`;

  const headers = new Headers();
  headers.set("Accept", "application/json");
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("Cookie", cookie);

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  try {
    const upstream = await fetch(target, init);
    const body = await upstream.arrayBuffer();
    const responseHeaders = new Headers();
    const upstreamType = upstream.headers.get("content-type");
    if (upstreamType) responseHeaders.set("Content-Type", upstreamType);
    return new NextResponse(body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      {
        error: "upstream_unreachable",
        message: "No se pudo contactar con el API de Care.",
      },
      { status: 502 },
    );
  }
}

export function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}

export function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, ctx);
}
