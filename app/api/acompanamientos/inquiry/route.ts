import { NextRequest, NextResponse } from "next/server";

import { careApiBaseUrl } from "@/lib/web-store/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

  const target = `${base}/public/acompanamientos/inquiry`;
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  const xf = req.headers.get("x-forwarded-for");
  if (xf) headers.set("x-forwarded-for", xf);

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers,
      body: await req.arrayBuffer(),
      cache: "no-store",
    });
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
