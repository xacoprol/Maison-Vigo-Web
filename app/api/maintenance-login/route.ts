import { NextResponse } from "next/server";

const MAINTENANCE_PASSWORD = "TrE43YNH_*";
const ACCESS_COOKIE = "mv_maintenance_access";
const ACCESS_VALUE = "granted";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const origin = new URL(request.url).origin;

  if (password !== MAINTENANCE_PASSWORD) {
    return NextResponse.redirect(`${origin}/mantenimiento?error=1`, 303);
  }

  const response = NextResponse.redirect(`${origin}/`, 303);
  response.cookies.set({
    name: ACCESS_COOKIE,
    value: ACCESS_VALUE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
