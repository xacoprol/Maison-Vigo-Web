/**
 * Configuración única del sitio y “interruptores” de SEO.
 *
 * En cada página nueva: exportar `metadata` con `title` + `description`,
 * y añadir la URL en `app/sitemap.ts`.
 *
 * Indexación: activa por defecto. Para staging/preview:
 * `NEXT_PUBLIC_ALLOW_INDEXING=false`
 *
 * URL canónica: `NEXT_PUBLIC_SITE_URL` (sin barra final).
 *
 * IA / asistentes: contenido en `/llms.txt` y `/.well-known/llms.txt` (Markdown).
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://maisonvigo.es";

/** Imagen social por defecto (Open Graph / Twitter). JPEG ligero ≤300KB. */
export const defaultOgImage = "/og/default.jpg";

/** Imagen representativa del negocio (JSON-LD LocalBusiness). */
export const businessImage = "/assets/images/cuidado-integral.webp";

/**
 * Indexación activa salvo que se desactive explícitamente
 * (`NEXT_PUBLIC_ALLOW_INDEXING=false`).
 */
export const allowIndexing =
  process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "false";

/** Portal de reservas (metadata + JSON-LD + llms.txt). Override con NEXT_PUBLIC_BOOKING_URL si cambia. */
export const bookingUrl =
  process.env.NEXT_PUBLIC_BOOKING_URL ?? "https://care.maisonvigo.es/reserva";

export const siteConfig = {
  shortName: "Maison Vigo",
  defaultTitle:
    "Maison Vigo | Peluquería canina en Vigo — Grooming y cuidado",
  titleTemplate: "%s — Maison Vigo",
  defaultDescription:
    "Peluquería canina en Vigo: grooming, bienestar y guardería familiar. Cuidado con calma, técnica y dermocosmética en Maison Vigo.",
  locale: "es_ES",
  regionLabel: "Vigo, España",
  /** Coordenadas aproximadas del local (Navia / Teixugueiras). */
  geo: {
    latitude: 42.2118,
    longitude: -8.7445,
  },
  social: {
    instagram: "https://instagram.com/maisonvigo",
    facebook: "https://facebook.com/maisonvigo",
    tiktok: "https://www.tiktok.com/@maison.vigo",
  },
  phones: {
    landline: "+34986233321",
    mobile: "+34644577798",
  },
  priceRange: "€€",
} as const;
