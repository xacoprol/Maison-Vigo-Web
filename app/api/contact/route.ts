import { NextResponse } from "next/server";

import { parseContactMailPayload, sendContactMail } from "@/lib/contact-mail";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "No pudimos leer el formulario." },
      { status: 400 },
    );
  }

  const parsed = parseContactMailPayload(body);

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await sendContactMail(parsed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "SMTP_NOT_CONFIGURED") {
      console.error("[contact] SMTP no configurado (SMTP_USER / SMTP_PASS).");
      return NextResponse.json(
        { error: "El envío de correo no está configurado todavía." },
        { status: 503 },
      );
    }

    console.error("[contact] Error al enviar:", error);
    return NextResponse.json(
      { error: "No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos." },
      { status: 500 },
    );
  }
}
