import { bookingUrl, siteConfig } from "@/lib/site-config";
import { getServicioServiciosItems } from "@/lib/servicio-servicios-data";
import { serviciosList, type ServicioSlug } from "@/lib/servicios-data";
import type { WebStoreCatalog } from "@/lib/web-store/types";
import { formatEuroFromCents } from "@/lib/web-store/utils";

export const CARE_ASSIST_MAX_USER_MESSAGES = 6;
export const CARE_ASSIST_MAX_MESSAGE_CHARS = 400;
export const CARE_ASSIST_MAX_HISTORY = 12;

/** Abre el panel de orientación (detalle opcional: `{ prompt?: string }`). */
export const CARE_ASSIST_OPEN_EVENT = "mv-care-assist-open";

/** Abre el modal de seguimiento de pedido (banner The Selection). */
export const ORDER_TRACK_OPEN_EVENT = "mv-order-track-open";

/** Abre el formulario de solicitud de acompañamiento (bodas / eventos). */
export const ACOMPANAMIENTO_INQUIRY_OPEN_EVENT = "mv-acompanamiento-inquiry-open";

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
  prompt?: string;
  action?: "order-track";
};

export const CARE_ASSIST_CHIPS: CareAssistChip[] = [
  {
    id: "grooming",
    label: "Baño o corte",
    prompt:
      "Mi perro necesita baño, corte o mantenimiento del manto. ¿Qué servicio de grooming encaja?",
  },
  {
    id: "bienestar",
    label: "Piel sensible",
    prompt:
      "Tiene la piel sensible o el manto necesita un seguimiento cutáneo. ¿Qué me recomendáis?",
  },
  {
    id: "guarderia",
    label: "Guardería",
    prompt:
      "Necesito que mi perro se quede en guardería, de día o también alguna noche. ¿Cómo funciona Guardería Familiar?",
  },
  {
    id: "evento",
    label: "Boda / Evento",
    prompt:
      "Tengo una boda o evento y quiero que estéis presentes cuidando a mi perro para poder estar con él en ese momento especial. ¿Cómo funciona el acompañamiento?",
  },
  {
    id: "tienda",
    label: "The Selection",
    prompt:
      "¿Qué productos tenéis en The Selection? Me interesan joyas, collares o accesorios.",
  },
  {
    id: "order-track",
    label: "Seguir pedido",
    action: "order-track",
  },
  {
    id: "reserva",
    label: "Reservar cita",
    prompt: "Quiero reservar una cita. ¿Cuál es el siguiente paso?",
  },
];

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

function productLooksPersonalizable(
  product: WebStoreCatalog["categories"][number]["products"][number],
): boolean {
  const p = product.personalization;
  if (!p || p.enabled === false) return false;
  return Boolean(
    (p.textFields?.length ?? 0) > 0 ||
      (p.photoFields?.length ?? 0) > 0 ||
      (p.quantityTextGroups?.length ?? 0) > 0,
  );
}

/** Resumen del catálogo público para el system prompt (precios = los publicados ahora). */
export function formatWebStoreCatalogForAssist(
  catalog: WebStoreCatalog | null,
): string {
  if (!catalog?.categories?.length) {
    return [
      "The Selection (/tienda): tienda online de Maison Vigo.",
      "Ahora mismo no hay productos públicos cargados en el catálogo (o no se pudo consultar).",
      "Si preguntan por la tienda, orienta a /tienda y no inventes piezas ni precios.",
    ].join("\n");
  }

  const blocks: string[] = [
    "The Selection (/tienda): tienda online pública (joyas, cosmética, accesorios y objetos seleccionados).",
    "Compra abierta en maisonvigo.es/tienda sin login obligatorio. Carrito y checkout en la misma web.",
    "Solo habla de productos que figuren abajo. Los precios son los publicados ahora en The Selection.",
    "Si piden grabado/personalización, indica que algunas piezas lo permiten en la ficha del producto.",
    "",
    "Productos publicados:",
  ];

  for (const category of catalog.categories) {
    blocks.push(`### ${category.name}`);
    for (const product of category.products) {
      const price = formatEuroFromCents(product.salePriceCents);
      const note = productLooksPersonalizable(product)
        ? " · personalizable"
        : "";
      const desc = product.description
        ? ` — ${product.description
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 140)}`
        : "";
      blocks.push(`- ${product.name}: ${price}${note}${desc}`);
    }
  }

  return blocks.join("\n");
}

export type CareAssistPromptOptions = {
  storeCatalogText?: string;
};

export function buildCareAssistSystemPrompt(
  options: CareAssistPromptOptions = {},
): string {
  const storeBlock =
    options.storeCatalogText?.trim() || formatWebStoreCatalogForAssist(null);

  return [
    `Eres la orientación de cuidado de ${siteConfig.shortName} (Vigo).`,
    "Hablas en español de España, con calma, claridad y tono editorial — nunca comercial agresivo.",
    "Tu trabajo: entender qué necesita el perro/familia y orientar hacia UN servicio, hacia The Selection (tienda), o aclarar si hace falta más info.",
    "Luego invita a reservar (citas de salón), a solicitar acompañamiento (bodas/eventos), a visitar /tienda, o a escribir por WhatsApp si la duda es operativa.",
    "",
    "Reglas estrictas:",
    "- No inventes precios de servicios/citas, tarifas de salón, disponibilidad ni huecos de agenda.",
    "- En productos de The Selection solo uses los precios y nombres del catálogo publicado más abajo.",
    "- No des diagnósticos veterinarios ni tratamientos médicos; ante duda de salud, sugiere consultar al veterinario y al equipo en salón.",
    "- No inventes direcciones, horarios ni teléfonos distintos a los del sitio.",
    "- No digas que eres ChatGPT u OpenAI; eres orientación de Maison Vigo.",
    "- Respuestas cortas: 2–4 frases máximo, más una sugerencia clara.",
    "- Si el usuario quiere reservar una cita de salón (grooming, bienestar, guardería, educación), indica «Reservar cita» (suggestBooking: true).",
    `- URL de reserva de citas (referencia): ${bookingUrl}`,
    "- Si es boda, evento, sesión fotográfica o acompañamiento in situ: NO uses suggestBooking. Usa suggestAcompanamiento: true (formulario de solicitud que llega al equipo).",
    "- Si pregunta por productos, joyas, collares, pulseras, regalos, cosmética para llevar a casa o The Selection: orienta a /tienda (suggestStore: true).",
    "- También pueden contactar por WhatsApp o teléfono del pie de página.",
    "",
    "Enrutado de servicios (prioridad clara):",
    "- Educación (educacion): conductas, comportamiento, nervios, ansiedad, miedos, reactividad, ladridos, tirones de correa, hábitos, convivencia, cachorros con educación, equilibrio emocional vinculado a conducta. NUNCA uses Bienestar para esto.",
    "- Bienestar (bienestar): piel, picores, manto con seguimiento cutáneo, ozonoterapia, planes cutáneos, recomendaciones de cosmética/casa para la piel. NO es el servicio de conducta.",
    "- Grooming (grooming): baño, corte, estética, nudos, mantenimiento del pelo sin foco en conducta.",
    "- Guardería Familiar (guarderia-familiar): MV Home. Estancias de DÍA y también de NOCHE (pernocta). Los perros pueden quedarse solo de día, solo de noche o combinar. Entorno reducido, tranquilo y supervisado. Si preguntan «¿solo de día?» aclara que también hay noches.",
    "- Acompañamiento (acompanamiento): presencia de Maison Vigo en bodas, eventos y momentos especiales cuidando al perro in situ, para que la familia pueda estar con él y vivir ese día juntos con tranquilidad. No es dejar al perro aparte: es cuidado presente para que forme parte del momento. También cubre sesiones fotográficas, traslados y acompañamientos a medida. Para este servicio: suggestAcompanamiento true y suggestBooking false.",
    "",
    "Formato de respuesta: SOLO un JSON válido, sin markdown ni texto fuera del JSON:",
    '{"reply":"texto para el usuario","serviceSlug":"grooming|bienestar|guarderia-familiar|acompanamiento|educacion"|null,"suggestBooking":true|false,"suggestStore":true|false,"suggestAcompanamiento":true|false}',
    "serviceSlug: el servicio más adecuado, o null si aún no está claro o la duda es de tienda.",
    "suggestBooking: true solo para citas de salón (no acompañamiento de evento).",
    "suggestStore: true si conviene abrir The Selection (/tienda).",
    "suggestAcompanamiento: true si conviene abrir el formulario de solicitud de acompañamiento (bodas/eventos).",
    "",
    "Catálogo de servicios:",
    buildServicesCatalog(),
    "",
    "MV Care: espacio digital del cliente (citas, historial, plan). Página: /mvcare. No gestiones cuentas aquí; orienta a esa página o a reservar.",
    "",
    storeBlock,
  ].join("\n");
}

export type CareAssistModelResult = {
  reply: string;
  serviceSlug: ServicioSlug | null;
  suggestBooking: boolean;
  suggestStore: boolean;
  suggestAcompanamiento: boolean;
};

export function parseCareAssistModelContent(
  raw: string,
): CareAssistModelResult {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      reply:
        trimmed.slice(0, 600) || "Cuéntame un poco más qué necesita tu perro.",
      serviceSlug: null,
      suggestBooking: false,
      suggestStore: false,
      suggestAcompanamiento: false,
    };
  }

  try {
    const data = JSON.parse(jsonMatch[0]) as {
      reply?: unknown;
      serviceSlug?: unknown;
      suggestBooking?: unknown;
      suggestStore?: unknown;
      suggestAcompanamiento?: unknown;
    };
    const reply =
      typeof data.reply === "string" && data.reply.trim()
        ? data.reply.trim().slice(0, 800)
        : "Cuéntame un poco más qué necesita tu perro.";
    const serviceSlug = isServicioSlug(data.serviceSlug)
      ? data.serviceSlug
      : null;
    let suggestBooking = data.suggestBooking === true;
    let suggestAcompanamiento =
      data.suggestAcompanamiento === true || serviceSlug === "acompanamiento";
    if (suggestAcompanamiento) suggestBooking = false;
    return {
      reply,
      serviceSlug,
      suggestBooking,
      suggestStore: data.suggestStore === true,
      suggestAcompanamiento,
    };
  } catch {
    return {
      reply: trimmed.slice(0, 600),
      serviceSlug: null,
      suggestBooking: false,
      suggestStore: false,
      suggestAcompanamiento: false,
    };
  }
}
