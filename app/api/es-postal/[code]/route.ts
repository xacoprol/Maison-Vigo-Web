import { NextResponse } from "next/server";

import {
  isCompleteEsPostalCode,
  lookupEsPostalCode,
  normalizeEsPostalCode,
} from "@/lib/es-postal";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code: raw } = await context.params;
  const code = normalizeEsPostalCode(raw ?? "");

  if (!isCompleteEsPostalCode(code)) {
    return NextResponse.json(
      { error: "invalid_postal_code" },
      { status: 400 },
    );
  }

  const result = await lookupEsPostalCode(code);
  if (!result) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=86400",
    },
  });
}
