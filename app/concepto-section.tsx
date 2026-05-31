import { WaveText } from "./wave-text";

type ConceptoSectionProps = {
  ctaHref?: string;
  ctaLabel?: string;
};

/** Bloque editorial `#concepto` de la home (Cuidado Perfeccionado). */
export function ConceptoSection({
  ctaHref = "/#contacto",
  ctaLabel = "Conócenos",
}: ConceptoSectionProps) {
  return (
    <section id="concepto">
      <div
        className="concepto-showcase reveal visible"
        data-parallax-section="concepto"
      >
        <div className="concepto-heading">
          <h2
            className="concepto-title-display"
            data-parallax="title-main"
            aria-hidden={true}
          >
            <span className="concepto-title-reveal">
              <img
                src="/assets/images/detalle.svg"
                alt=""
                className="concepto-title-svg"
                loading="lazy"
              />
            </span>
          </h2>
          <p className="concepto-overline" data-parallax="title-small">
            <span>Cuidado</span>
            <span>Perfeccionado</span>
            <span>con el tiempo</span>
          </p>
        </div>
        <div
          className="concepto-image-shell concepto-image-shell--bg"
          data-parallax="media"
        >
          <img
            src="https://grigoriak.doctor/assets/images/media/landing/1.intro/background@xs.webp?v=1776434913"
            alt=""
            className="concepto-image-main concepto-image-main--bg"
            loading="lazy"
          />
        </div>
        <div
          className="concepto-image-shell concepto-image-shell--top"
          data-parallax="media"
        >
          <img
            src="/assets/images/caniche.webp"
            alt="Maison Vigo — retrato conceptual."
            className="concepto-image-main concepto-image-main--top"
            loading="lazy"
          />
        </div>

        <p className="concepto-intro-copy" data-parallax="intro-copy">
          Trabajamos cada sesión de forma tranquila y precisa, respetando el
          bienestar, el ritmo y las necesidades de cada perro.
        </p>

        <blockquote className="concepto-quote" data-parallax="quote">
          <img
            src="/assets/images/iconos/quotes.svg"
            alt=""
            width={35}
            height={30}
            className="concepto-quote-mark"
            aria-hidden={true}
          />
          <p>
            Creemos que el verdadero cuidado se percibe en los pequeños
            detalles: el ambiente, el tiempo, la técnica y la atención.
          </p>
          <footer>Maison Vigo</footer>
        </blockquote>

        <a
          href={ctaHref}
          className="concepto-circle-cta mob-link--wave"
          data-parallax="cta"
        >
          <svg
            className="concepto-circle-cta-ring"
            viewBox="0 0 100 100"
            aria-hidden={true}
          >
            <circle
              className="concepto-circle-cta-ring-path"
              cx="50"
              cy="50"
              r="49.5"
            />
          </svg>
          <span className="concepto-circle-cta-label">
            <WaveText text={ctaLabel} />
          </span>
        </a>
      </div>
    </section>
  );
}
