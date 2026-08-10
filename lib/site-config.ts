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
  defaultTitle: "Maison Vigo — Cuidado canino en Vigo",
  titleTemplate: "%s — Maison Vigo",
  defaultDescription:
    "Grooming, bienestar, guardería familiar, educación y acompañamiento en un espacio pensado para el cuidado con calma, técnica y continuidad.",
  locale: "es_ES",
  regionLabel: "Vigo, España",
} as const;
