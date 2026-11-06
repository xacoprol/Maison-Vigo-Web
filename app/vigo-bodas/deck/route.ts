import { readFileSync } from "node:fs";
import { join } from "node:path";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  VIGO_BODAS_ACCESS_COOKIE,
  hasVigoBodasAccess,
} from "@/lib/vigo-bodas-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const jar = await cookies();
  if (!hasVigoBodasAccess(jar.get(VIGO_BODAS_ACCESS_COOKIE)?.value)) {
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/vigo-bodas`, 303);
  }

  const html = readFileSync(
    join(process.cwd(), "content/vigo-bodas/bodas-deck.html"),
    "utf8",
  );

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
