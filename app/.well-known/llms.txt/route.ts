import { NextResponse } from "next/server";

import { buildLlmsTxt, llmsTxtHeaders } from "@/lib/llms-txt";

/** Espejo estándar en /.well-known/ para herramientas que buscan el fichero aquí. */
export function GET() {
  return new NextResponse(buildLlmsTxt(), { headers: llmsTxtHeaders() });
}
