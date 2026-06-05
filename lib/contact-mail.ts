import nodemailer from "nodemailer";

export type ContactMailPayload = {
  name: string;
  email: string;
  subject: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseContactMailPayload(
  body: unknown,
): ContactMailPayload | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Datos del formulario no válidos." };
  }

  const { name, email, subject } = body as Record<string, unknown>;
  const trimmedName = String(name ?? "").trim();
  const trimmedEmail = String(email ?? "").trim();
  const trimmedSubject = String(subject ?? "").trim();

  if (!trimmedName) return { error: "Indica tu nombre." };
  if (!trimmedEmail) return { error: "Indica tu email." };
  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    return { error: "Revisa el formato del email." };
  }
  if (!trimmedSubject) return { error: "Indica el asunto." };
  if (trimmedName.length > 120) return { error: "El nombre es demasiado largo." };
  if (trimmedEmail.length > 254) return { error: "El email es demasiado largo." };
  if (trimmedSubject.length > 200) {
    return { error: "El asunto es demasiado largo." };
  }

  return {
    name: trimmedName,
    email: trimmedEmail,
    subject: trimmedSubject,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendContactMail(payload: ContactMailPayload) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  const host = process.env.SMTP_HOST ?? "smtp.ionos.es";
  const port = Number(process.env.SMTP_PORT ?? "587");
  const to = process.env.CONTACT_TO ?? user;
  const from = process.env.CONTACT_FROM ?? user;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeSubject = escapeHtml(payload.subject);

  await transporter.sendMail({
    from: `Maison Vigo <${from}>`,
    to,
    replyTo: payload.email,
    subject: `[Contacto web] ${payload.subject}`,
    text: [
      "Nuevo mensaje desde el formulario de contacto",
      "",
      `Nombre: ${payload.name}`,
      `Email: ${payload.email}`,
      `Asunto: ${payload.subject}`,
    ].join("\n"),
    html: [
      "<p>Nuevo mensaje desde el formulario de contacto de Maison Vigo.</p>",
      "<ul>",
      `<li><strong>Nombre:</strong> ${safeName}</li>`,
      `<li><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></li>`,
      `<li><strong>Asunto:</strong> ${safeSubject}</li>`,
      "</ul>",
    ].join(""),
  });
}
