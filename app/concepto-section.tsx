/** Bloque editorial `#concepto` de la home (Cuidado Perfeccionado). */
export function ConceptoSection() {
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
            alt="Caniche cuidado en Maison Vigo, peluquería canina en Vigo"
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
      </div>
    </section>
  );
}
