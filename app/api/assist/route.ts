import { NextResponse } from "next/server";

import {
  CARE_ASSIST_MAX_HISTORY,
  CARE_ASSIST_MAX_MESSAGE_CHARS,
  CARE_ASSIST_MAX_USER_MESSAGES,
  buildCareAssistSystemPrompt,
  formatWebStoreCatalogForAssist,
  parseCareAssistModelContent,
  type CareAssistMessage,
} from "@/lib/care-assist";
import { SERVICIOS } from "@/lib/servicios-data";
import { fetchWebStoreCatalog } from "@/lib/web-store/api";

export const runtime = "nodejs";

type AssistRequestBody = {
  messages?: unknown;
};

function normalizeMessages(input: unknown): CareAssistMessage[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;

  const messages: CareAssistMessage[] = [];
  let userCount = 0;

  for (const item of input.slice(-CARE_ASSIST_MAX_HISTORY)) {
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const text = content.trim().slice(0, CARE_ASSIST_MAX_MESSAGE_CHARS);
    if (!text) return null;
    if (role === "user") userCount += 1;
    messages.push({ role, content: text });
  }

  if (userCount === 0 || userCount > CARE_ASSIST_MAX_USER_MESSAGES) return null;
  if (messages[messages.length - 1]?.role !== "user") return null;

  return messages;
}

async function loadStoreCatalogText(): Promise<string> {
  try {
    const catalog = await fetchWebStoreCatalog();
    return formatWebStoreCatalogForAssist(catalog);
  } catch (error) {
    console.error("[assist] catalog fetch failed:", error);
    return formatWebStoreCatalogForAssist(null);
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "La orientación no está disponible todavía. Puedes reservar cita o escribirnos por WhatsApp.",
      },
      { status: 503 },
    );
  }

  let body: AssistRequestBody;
  try {
    body = (await request.json()) as AssistRequestBody;
  } catch {
    return NextResponse.json(
      { error: "No pudimos leer el mensaje." },
      { status: 400 },
    );
  }

  const messages = normalizeMessages(body.messages);
  if (!messages) {
    return NextResponse.json(
      { error: "Mensaje no válido. Prueba con una frase breve." },
      { status: 400 },
    );
  }

  const model = process.env.OPENAI_ASSIST_MODEL?.trim() || "gpt-4o-mini";
  const storeCatalogText = await loadStoreCatalogText();

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 360,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: buildCareAssistSystemPrompt({ storeCatalogText }),
          },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error("[assist] OpenAI error:", upstream.status, detail.slice(0, 400));
      return NextResponse.json(
        {
          error:
            "Ahora mismo no puedo orientarte. Reserva cita o escríbenos por WhatsApp.",
        },
        { status: 502 },
      );
    }

    const payload = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    const parsed = parseCareAssistModelContent(raw);
    const service = parsed.serviceSlug
      ? SERVICIOS[parsed.serviceSlug]
      : null;

    return NextResponse.json({
      reply: parsed.reply,
      serviceSlug: parsed.serviceSlug,
      serviceTitle: service?.title ?? null,
      serviceHref: service ? `/servicios/${service.slug}` : null,
      suggestBooking: parsed.suggestBooking,
      suggestStore: parsed.suggestStore,
      storeHref: parsed.suggestStore ? "/tienda" : null,
    });
  } catch (error) {
    console.error("[assist] Error:", error);
    return NextResponse.json(
      {
        error:
          "Ha habido un problema al responder. Inténtalo de nuevo o reserva cita.",
      },
      { status: 500 },
    );
  }
}
