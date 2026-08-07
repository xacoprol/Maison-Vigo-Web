import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ storeOrderRef: string }> };

/**
 * URLOK Redsys para pedidos channel=web.
 * Care apunta aquí: `/api/redsys-pago-return/web-tienda/{storeOrderRef}`
 * Redirige a la página de gracias (POST del TPV no puede ser un redirect limpio
 * en todos los bancos, así que devolvemos HTML con location.replace).
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const { storeOrderRef: raw } = await ctx.params;
  const storeOrderRef = decodeURIComponent(String(raw ?? "").trim());
  if (!storeOrderRef) {
    return NextResponse.redirect(new URL("/tienda", req.url), 307);
  }
  const nextPath = `/tienda/pedido-ok?storeOrderRef=${encodeURIComponent(storeOrderRef)}`;
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Redirigiendo…</title></head><body><script>location.replace(${JSON.stringify(nextPath)});</script></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { storeOrderRef: raw } = await ctx.params;
  const storeOrderRef = decodeURIComponent(String(raw ?? "").trim());
  if (!storeOrderRef) {
    return NextResponse.redirect(new URL("/tienda", req.url), 307);
  }
  const dest = `/tienda/pedido-ok?storeOrderRef=${encodeURIComponent(storeOrderRef)}`;
  return NextResponse.redirect(new URL(dest, req.url), 307);
}
