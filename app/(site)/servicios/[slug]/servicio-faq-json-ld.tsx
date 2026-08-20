import { buildServicioFaqJsonLd } from "@/lib/servicio-faq";
import { allowIndexing, siteUrl } from "@/lib/site-config";
import type { ServicioSlug } from "@/lib/servicios-data";

type ServicioFaqJsonLdProps = {
  slug: ServicioSlug;
};

/** FAQPage JSON-LD (SSR) a partir del contenido FAQ / acordeón de la ficha. */
export function ServicioFaqJsonLd({ slug }: ServicioFaqJsonLdProps) {
  if (!allowIndexing) return null;

  const faqJsonLd = buildServicioFaqJsonLd(slug, siteUrl);
  if (!faqJsonLd) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
    />
  );
}
