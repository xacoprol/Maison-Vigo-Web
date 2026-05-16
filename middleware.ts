import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE = "mv_maintenance_access";
const ACCESS_VALUE = "granted";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname === "/mantenimiento" ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(?:svg|png|jpg|jpeg|webp|gif|ico|mp4|txt|xml|json)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const hasAccess = request.cookies.get(ACCESS_COOKIE)?.value === ACCESS_VALUE;
  if (hasAccess) {
    return NextResponse.next();
  }

  const maintenanceUrl = new URL("/mantenimiento", request.url);
  return NextResponse.redirect(maintenanceUrl);
}

export const config = {
  matcher: "/:path*",
};
