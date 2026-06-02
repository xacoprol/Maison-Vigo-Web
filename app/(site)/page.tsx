import { ConceptoSection } from "../concepto-section";
import { EspacioHorizontalSection } from "../espacio-horizontal-section";
import { HomeEffects } from "../home-effects";
import { RitmoCuidadoAccordion } from "../ritmo-cuidado-accordion";
import { ServiciosCarousel } from "../servicios-carousel";
import { WaveText } from "../wave-text";

export default function Home() {
  return (
    <>
      <HomeEffects />
      <div className="logo-intro" id="logoIntro" aria-hidden={true}>
        <img
          src="/logo-anim/anim-1.svg"
          alt=""
          width={704}
          height={478}
          className="logo-intro-piece logo-intro-piece--one"
        />
        <img
          src="/logo-anim/anim-2.svg"
          alt=""
          width={704}
          height={478}
          className="logo-intro-piece logo-intro-piece--two"
        />
        <img
          src="/logo-anim/anim-3.svg"
          alt=""
          width={704}
          height={478}
          className="logo-intro-piece logo-intro-piece--three"
        />
      </div>

      <section id="hero">
        <div className="hero-media" aria-hidden={true}>
          <video
            id="heroVideo"
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src="/maison-vigo.mp4" type="video/mp4" />
          </video>
          <div className="hero-video-overlay" />
        </div>

        <div className="hero-inner">
          <h1 className="hero-title">
            <span className="hero-title-reveal">
              <span className="hero-title__line">Más que una</span>
              <span className="hero-title__line">peluquería canina</span>
            </span>
          </h1>
          <p className="hero-sub">
            <span className="hero-sub-line">Cuidado, calma y estética</span>
            <span className="hero-sub-line">
              en un entorno pensado para su bienestar.
            </span>
          </p>
          <a
            href="/#concepto"
            className="hero-scroll-cta"
            aria-label="Bajar a la sección Concepto"
          >
            <span className="hero-scroll-cta-inner">
              <svg
                className="hero-scroll-cta-ring"
                viewBox="0 0 100 100"
                aria-hidden={true}
              >
                <circle
                  className="hero-scroll-cta-ring-path"
                  cx="50"
                  cy="50"
                  r="49.5"
                />
              </svg>
              <span className="hero-scroll-cta-arrow-wrap" aria-hidden={true}>
                <img
                  src="/assets/images/iconos/arrow-down.svg"
                  alt=""
                  width={30}
                  height={30}
                  className="hero-scroll-cta-arrow hero-scroll-cta-arrow--top"
                />
                <img
                  src="/assets/images/iconos/arrow-down.svg"
                  alt=""
                  width={30}
                  height={30}
                  className="hero-scroll-cta-arrow hero-scroll-cta-arrow--bottom"
                />
              </span>
            </span>
          </a>
        </div>
      </section>

      <ConceptoSection />

      <EspacioHorizontalSection />

      <section id="servicios">
        <div className="servicios-parallax-layer servicios-parallax-layer--heading">
          <div className="servicios-heading-viewport">
            <header className="servicios-heading servicios-heading-display">
              <h2 className="servicios-heading__title">
                <span className="servicios-heading-reveal">
                  Cuidado
                  <br aria-hidden="true" />
                  integral
                </span>
              </h2>
            </header>
          </div>
        </div>

        <div className="servicios-parallax-layer servicios-parallax-layer--carousel">
          <div className="servicios-carousel-wrap reveal">
            <ServiciosCarousel />
          </div>
        </div>
      </section>

      <RitmoCuidadoAccordion />

    </>
  );
}
