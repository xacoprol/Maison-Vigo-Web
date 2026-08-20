import { groomingFaqItems, type GroomingFaqItem } from "@/lib/grooming-faq";
import { getServicioServiciosItems } from "@/lib/servicio-servicios-data";
import type { ServicioSlug } from "@/lib/servicios-data";

export type ServicioFaqItem = GroomingFaqItem;

/**
 * Preguntas/respuestas para FAQPage JSON-LD por servicio.
 * Grooming: bloque FAQ editorial (`lib/grooming-faq.ts`).
 * Resto: acordeón «Servicios» de cada ficha (mismo texto que el HTML visible).
 */
export function getServicioFaqItems(slug: ServicioSlug): ServicioFaqItem[] {
  if (slug === "grooming") {
    return groomingFaqItems;
  }

  return getServicioServiciosItems(slug).map((item) => ({
    question: item.title,
    answer: item.desc.join(" "),
  }));
}

export function buildServicioFaqJsonLd(slug: ServicioSlug, siteUrl: string) {
  const items = getServicioFaqItems(slug);
  if (items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteUrl}/servicios/${slug}#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
