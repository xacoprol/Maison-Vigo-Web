import { groomingFaqItems } from "@/lib/grooming-faq";

/**
 * Bloque SEO editorial de grooming: en el HTML para buscadores, oculto visualmente.
 * El FAQPage JSON-LD vive en {@link ServicioFaqJsonLd} (todas las fichas de servicio).
 */
export function ServicioGroomingFaq() {
  return (
    <aside
      className="seo-visually-hidden"
      id="grooming-faq"
      aria-hidden={true}
    >
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
