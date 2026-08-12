import { groomingFaqItems } from "@/lib/grooming-faq";
import { allowIndexing, siteUrl } from "@/lib/site-config";

/**
 * Bloque SEO de grooming: en el HTML para buscadores, oculto visualmente.
 * Incluye párrafos de keyword + FAQ (markup + FAQPage JSON-LD).
 */
export function ServicioGroomingFaq() {
  const faqJsonLd = allowIndexing
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${siteUrl}/servicios/grooming#faq`,
        mainEntity: groomingFaqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;

  return (
    <aside
      className="seo-visually-hidden"
      id="grooming-faq"
      aria-hidden={true}
    >
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}

      <h2>Peluquería canina en Vigo, con claridad</h2>
      <p>
        En nuestra peluquería canina Vigo el protocolo puede incluir baño
        personalizado, deslanado, corte comercial o de raza, stripping cuando
        corresponde y detalles como el corte de uñas. Trabajamos con razas de
        todo tipo y con mestizos: lo que cambia no es la atención, sino el ritmo
        y la técnica que cada manto pide.
      </p>
      <p>
        La diferencia de Maison Vigo está en la calma del espacio, la precisión
        del grooming canino y una cosmética elegida para la piel real de cada
        perro. Buscamos un acabado equilibrado —estética canina en Vigo sin
        excesos— y una experiencia que invite a volver con confianza. Si buscas
        corte de perros en Vigo con seguimiento entre visitas, el cuidado
        continúa con la misma mirada calmada.
      </p>

      <section aria-label="Preguntas frecuentes sobre peluquería canina en Vigo">
        {groomingFaqItems.map((item) => (
          <div key={item.question}>
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </section>
    </aside>
  );
}
