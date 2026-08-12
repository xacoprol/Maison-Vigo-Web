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
  "https://www.maisonvigo.es";

/** Imagen social por defecto (Open Graph / Twitter). JPEG ligero ≤300KB. */
export const defaultOgImage = "/og/default.jpg";

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
    "Peluquería Canina en Vigo | Maison Vigo — Grooming y Bienestar",
  titleTemplate: "%s — Maison Vigo",
  /** Meta description ≤155 caracteres; incluye keyword + servicios clave. */
  defaultDescription:
    "Peluquería canina en Vigo con grooming, bienestar y guardería. Cuidado con calma, técnica y continuidad en Maison Vigo.",
  locale: "es_ES",
  regionLabel: "Vigo, España",
  phones: ["+34986233321", "+34644577798"] as const,
  priceRange: "€€",
  geo: {
    latitude: 42.20653,
    longitude: -8.75956,
  },
  sameAs: [
    "https://instagram.com/maisonvigo",
    "https://facebook.com/maisonvigo",
    "https://www.tiktok.com/@maison.vigo",
  ] as const,
  openingHours: [
    {
      days: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
      ] as const,
      opens: "10:00",
      closes: "18:00",
    },
    {
      days: ["Saturday"] as const,
      opens: "10:00",
      closes: "14:00",
    },
  ] as const,
} as const;
