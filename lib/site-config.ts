/**
 * Configuración única del sitio y “interruptores” de SEO.
 *
 * En cada página nueva: exportar `metadata` con `title` + `description`,
 * y si indexas, añadir la URL en `app/sitemap.ts`.
 *
 * Para lanzamiento en buscadores:
 * - `NEXT_PUBLIC_SITE_URL` = URL canónica (sin barra final)
 * - `NEXT_PUBLIC_ALLOW_INDEXING=true`
 *
 * IA / asistentes: contenido en `/llms.txt` y `/.well-known/llms.txt` (Markdown).
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://www.maisonvigo.es";

export const allowIndexing =
  process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

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
