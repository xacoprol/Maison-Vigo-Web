import { NextResponse } from "next/server";

import {
  VIGO_BODAS_ACCESS_COOKIE,
  VIGO_BODAS_ACCESS_VALUE,
  vigoBodasPassword,
} from "@/lib/vigo-bodas-auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const origin = new URL(request.url).origin;

  if (password !== vigoBodasPassword()) {
    return NextResponse.redirect(`${origin}/vigo-bodas?error=1`, 303);
  }

  const response = NextResponse.redirect(`${origin}/vigo-bodas/deck`, 303);
  response.cookies.set({
    name: VIGO_BODAS_ACCESS_COOKIE,
    value: VIGO_BODAS_ACCESS_VALUE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
