import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/lib/site-config";

import { ConceptoSection } from "../concepto-section";
import { EspacioHorizontalSection } from "../espacio-horizontal-section";
import { GoogleReviewsSection } from "../google-reviews-section";
import { HomeEffects } from "../home-effects";
import { RitmoCuidadoAccordion } from "../ritmo-cuidado-accordion";
import { ServiciosCarousel } from "../servicios-carousel";

export const metadata: Metadata = {
  title: {
    absolute: siteConfig.defaultTitle,
  },
  description: siteConfig.defaultDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
  },
};

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
            <source
              src="/assets/videos/maison-vigo.webm"
              type="video/webm"
            />
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
          <h2 className="hero-local-heading seo-visually-hidden">
            Tu peluquería canina de confianza en Vigo
          </h2>
          <p className="hero-sub">
            <span className="hero-sub-line">Cuidado, calma y estética</span>
            <span className="hero-sub-line">
              en un espacio pensado para su bienestar.
            </span>
          </p>
          <Link
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
          </Link>
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

        <div className="home-seo-grooming seo-visually-hidden">
          <div className="home-seo-grooming__inner">
            <p className="home-seo-grooming__eyebrow">Peluquería canina Vigo</p>
            <h2 className="home-seo-grooming__title">
              Grooming canino con calma, técnica y continuidad
            </h2>
            <div className="home-seo-grooming__copy">
              <p>
                En Maison Vigo, la peluquería canina en Vigo se entiende como un
                ritual de cuidado: baño con dermocosmética adecuada, deslanado
                cuando el manto lo pide, corte de uñas y acabados que respetan
                la estructura de cada perro. No forzamos un resultado único;
                observamos piel, sensibilidad y ritmo antes de empezar.
              </p>
              <p>
                El grooming canino en Vigo que ofrecemos se adapta a razas de
                pelo corto, doble capa, pelo duro o mantos que necesitan
                stripping. También a mestizos y a perros que prefieren sesiones
                más pausadas. La estética canina en Vigo, para nosotros, va unida
                al bienestar: menos sobreestimulación, más precisión y un
                ambiente pensado para que la experiencia sea serena.
              </p>
              <p>
                Si buscas corte de perros en Vigo con seguimiento entre visitas,
                MV Care reúne historial, recomendaciones y próximas citas. Así el
                cuidado no termina al salir del salón: continúa con la misma
                mirada calmada que guía cada sesión en Maison Vigo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <RitmoCuidadoAccordion />

      <GoogleReviewsSection />

    </>
  );
}
