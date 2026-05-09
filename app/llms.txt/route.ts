import { NextResponse } from "next/server";

import { buildLlmsTxt, llmsTxtHeaders } from "@/lib/llms-txt";

export function GET() {
  return new NextResponse(buildLlmsTxt(), { headers: llmsTxtHeaders() });
}
