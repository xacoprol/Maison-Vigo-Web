import "./servicio-grooming-seo.css";

type ServicioGroomingSeoCopyProps = {
  paragraphs: string[];
};

/** Bloque editorial SEO bajo el slideshow de grooming (responsive). */
export function ServicioGroomingSeoCopy({
  paragraphs,
}: ServicioGroomingSeoCopyProps) {
  if (paragraphs.length === 0) return null;

  return (
    <section
      id="grooming-editorial"
      className="servicio-grooming-seo"
      aria-labelledby="grooming-editorial-heading"
    >
      <div className="servicio-grooming-seo__inner">
        <p className="section-label">El servicio</p>
        <h2
          id="grooming-editorial-heading"
          className="servicio-grooming-seo__title"
        >
          Peluquería canina en Vigo, con calma y técnica
        </h2>
        <div className="servicio-grooming-seo__copy">
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
