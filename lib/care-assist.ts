import { bookingUrl, siteConfig } from "@/lib/site-config";
import { getServicioServiciosItems } from "@/lib/servicio-servicios-data";
import { serviciosList, type ServicioSlug } from "@/lib/servicios-data";

export const CARE_ASSIST_MAX_USER_MESSAGES = 6;
export const CARE_ASSIST_MAX_MESSAGE_CHARS = 400;
export const CARE_ASSIST_MAX_HISTORY = 12;

/** Abre el panel de orientación (detalle opcional: `{ prompt?: string }`). */
export const CARE_ASSIST_OPEN_EVENT = "mv-care-assist-open";

export type CareAssistOpenDetail = {
  prompt?: string;
};

export type CareAssistRole = "user" | "assistant";

export type CareAssistMessage = {
  role: CareAssistRole;
  content: string;
};

export type CareAssistChip = {
  id: string;
  label: string;
  prompt: string;
};

export const CARE_ASSIST_CHIPS: CareAssistChip[] = [
  {
    id: "grooming",
    label: "Manto y estética",
    prompt: "Mi perro necesita cuidado del manto y la estética. ¿Qué servicio encaja?",
  },
  {
    id: "bienestar",
    label: "Piel o manto",
    prompt: "Tiene la piel sensible o el manto necesita un seguimiento cutáneo. ¿Qué me recomendáis?",
  },
  {
    id: "guarderia",
    label: "Guardería de día",
    prompt: "Busco una guardería de día tranquila y supervisada. ¿Encaja Guardería Familiar?",
  },
  {
    id: "evento",
    label: "Boda o evento",
    prompt: "Tengo una boda o evento y quiero acompañamiento para mi perro. ¿Cómo funciona?",
  },
  {
    id: "educacion",
    label: "Conducta o nervios",
    prompt:
      "Mi perro está nervioso o tenemos dudas de conducta y convivencia. ¿Qué servicio encaja?",
  },
  {
    id: "reserva",
    label: "Quiero reservar",
    prompt: "Quiero reservar una cita. ¿Cuál es el siguiente paso?",
  },
];

/** Chips compactos para la card del menú (no saturar el panel). */
export const CARE_ASSIST_MENU_CHIP_IDS = [
  "grooming",
  "guarderia",
  "educacion",
] as const;

export const CARE_ASSIST_MENU_CHIPS: CareAssistChip[] =
  CARE_ASSIST_MENU_CHIP_IDS.map(
    (id) => CARE_ASSIST_CHIPS.find((chip) => chip.id === id)!,
  );

export const CARE_ASSIST_SERVICE_SLUGS = new Set<string>(
  serviciosList.map((s) => s.slug),
);

export function isServicioSlug(value: unknown): value is ServicioSlug {
  return typeof value === "string" && CARE_ASSIST_SERVICE_SLUGS.has(value);
}

function buildServicesCatalog(): string {
  return serviciosList
    .map((servicio) => {
      const offerings = getServicioServiciosItems(servicio.slug)
        .map((item) => `  - ${item.title}`)
        .join("\n");
      return [
        `### ${servicio.title} (slug: ${servicio.slug})`,
        `URL: /servicios/${servicio.slug}`,
        servicio.subtitle.replace(/\n/g, " "),
        servicio.body,
        "Incluye:",
        offerings,
      ].join("\n");
    })
    .join("\n\n");
}

export function buildCareAssistSystemPrompt(): string {
  return [
    `Eres la orientación de cuidado de ${siteConfig.shortName} (Vigo).`,
    "Hablas en español de España, con calma, claridad y tono editorial — nunca comercial agresivo.",
    "Tu trabajo: entender qué necesita el perro/familia y orientar hacia UN servicio (o aclarar si hace falta más info).",
    "Luego invita a reservar o a escribir por WhatsApp si la duda es operativa.",
    "",
    "Reglas estrictas:",
    "- No inventes precios, tarifas, disponibilidad ni huecos de agenda.",
    "- No des diagnósticos veterinarios ni tratamientos médicos; ante duda de salud, sugiere consultar al veterinario y al equipo en salón.",
    "- No inventes direcciones, horarios ni teléfonos distintos a los del sitio.",
    "- No digas que eres ChatGPT u OpenAI; eres orientación de Maison Vigo.",
    "- Respuestas cortas: 2–4 frases máximo, más una sugerencia clara.",
    "- Si el usuario quiere reservar, indica que puede hacerlo desde «Reservar cita» en la web (portal de reservas).",
    `- URL de reserva (referencia): ${bookingUrl}`,
    "- También pueden contactar por WhatsApp o teléfono del pie de página.",
    "",
    "Enrutado de servicios (prioridad clara):",
    "- Educación (educacion): conductas, comportamiento, nervios, ansiedad, miedos, reactividad, ladridos, tirones de correa, hábitos, convivencia, cachorros con educación, equilibrio emocional vinculado a conducta. NUNCA uses Bienestar para esto.",
    "- Bienestar (bienestar): piel, picores, manto con seguimiento cutáneo, ozonoterapia, planes cutáneos, recomendaciones de cosmética/casa para la piel. NO es el servicio de conducta.",
    "- Grooming (grooming): baño, corte, estética, nudos, mantenimiento del pelo sin foco en conducta.",
    "- Guardería Familiar (guarderia-familiar): estancia de día, MV Home, socialización supervisada en guardería.",
    "- Acompañamiento (acompanamiento): bodas, eventos, momentos en los que no pueden estar con el perro.",
    "",
    "Formato de respuesta: SOLO un JSON válido, sin markdown ni texto fuera del JSON:",
    '{"reply":"texto para el usuario","serviceSlug":"grooming|bienestar|guarderia-familiar|acompanamiento|educacion"|null,"suggestBooking":true|false}',
    "serviceSlug: el servicio más adecuado, o null si aún no está claro.",
    "suggestBooking: true si conviene reservar o pedir cita.",
    "",
    "Catálogo de servicios:",
    buildServicesCatalog(),
    "",
    "MV Care: espacio digital del cliente (citas, historial, plan). Página: /mvcare. No gestiones cuentas aquí; orienta a esa página o a reservar.",
  ].join("\n");
}

export type CareAssistModelResult = {
  reply: string;
  serviceSlug: ServicioSlug | null;
  suggestBooking: boolean;
};

export function parseCareAssistModelContent(
  raw: string,
): CareAssistModelResult {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      reply: trimmed.slice(0, 600) || "Cuéntame un poco más qué necesita tu perro.",
      serviceSlug: null,
      suggestBooking: false,
    };
  }

  try {
    const data = JSON.parse(jsonMatch[0]) as {
      reply?: unknown;
      serviceSlug?: unknown;
      suggestBooking?: unknown;
    };
    const reply =
      typeof data.reply === "string" && data.reply.trim()
        ? data.reply.trim().slice(0, 800)
        : "Cuéntame un poco más qué necesita tu perro.";
    return {
      reply,
      serviceSlug: isServicioSlug(data.serviceSlug) ? data.serviceSlug : null,
      suggestBooking: data.suggestBooking === true,
    };
  } catch {
    return {
      reply: trimmed.slice(0, 600),
      serviceSlug: null,
      suggestBooking: false,
    };
  }
}
