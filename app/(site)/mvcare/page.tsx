import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  mvcareClose,
  mvcareFaq,
  mvcareHero,
  mvcareStart,
  mvcareSteps,
  mvcareWhatIs,
} from "@/lib/mvcare-content";
import { siteConfig } from "@/lib/site-config";

import { MvcareBenefits } from "./mvcare-benefits";
import { MvcareFeaturesCarousel } from "./mvcare-features-carousel";
import { MvcareCta } from "./mvcare-cta";
import { MvcareEffects } from "./mvcare-effects";
import { MvcareFaq } from "./mvcare-faq";
import "./mvcare.css";

export const metadata: Metadata = {
  title: "MV Care",
  description:
    "El cuidado continúa más allá de cada sesión. Seguimiento personalizado, historial y continuidad para el bienestar de tu perro en Maison Vigo.",
  alternates: { canonical: "/mvcare" },
  openGraph: {
    title: `MV Care — ${siteConfig.shortName}`,
    description:
      "Espacio digital para clientes: historial, plan de cuidado, citas y recomendaciones entre sesiones.",
    url: "/mvcare",
    images: [{ url: mvcareHero.image }],
  },
};

export default function MvcarePage() {
  return (
    <>
      <MvcareEffects />
      <main className="mvcare">
        <section className="mvcare-hero" aria-label="MV Care">
          <div className="mvcare-hero__media" aria-hidden={true}>
            <Image
              src={mvcareHero.image}
              alt=""
              fill
              priority
              sizes="100vw"
              className="mvcare-hero__img"
            />
            <span className="mvcare-hero__overlay" />
          </div>

          <div className="mvcare-hero__inner">
            <h1 className="hero-title mvcare-hero__title">
              <span className="mvcare-hero__title-reveal">
                <span className="mvcare-hero__title-line">
                  <span className="mvcare-hero__title-el">{mvcareHero.titleEl}</span>{" "}
                  <span className="mvcare-hero__title-rest">
                    {mvcareHero.titleLine1Rest}
                  </span>
                </span>
                <span className="mvcare-hero__title-line mvcare-hero__title-rest">
                  {mvcareHero.titleLine2}
                </span>
              </span>
            </h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mvcareHero.logoSrc}
              alt={mvcareHero.logoAlt}
              width={248}
              height={74}
              className="mvcare-hero__logo"
              decoding="async"
            />
            <p className="mvcare-hero__lead">{mvcareHero.subtitle}</p>
            <MvcareCta variant="hero" />
          </div>

          <a
            href="#mvcare-que-es"
            className="mvcare-hero__scroll servicio__scroll-cta"
            aria-label="Descubrir MV Care"
          >
            <span className="servicio__scroll-cta-inner">
              <svg
                className="servicio__scroll-cta-ring"
                viewBox="0 0 100 100"
                aria-hidden={true}
              >
                <circle
                  className="servicio__scroll-cta-ring-path"
                  cx="50"
                  cy="50"
                  r="49.5"
                />
              </svg>
              <span
                className="servicio__scroll-cta-arrow-wrap"
                aria-hidden={true}
              >
                <img
                  src="/assets/images/iconos/arrow-down.svg"
                  alt=""
                  className="servicio__scroll-cta-arrow servicio__scroll-cta-arrow--top"
                  width={14}
                  height={14}
                />
                <img
                  src="/assets/images/iconos/arrow-down.svg"
                  alt=""
                  className="servicio__scroll-cta-arrow servicio__scroll-cta-arrow--bottom"
                  width={14}
                  height={14}
                />
              </span>
            </span>
          </a>
        </section>

        <section
          id="mvcare-que-es"
          className="mvcare-section mvcare-section--dark mvcare-what"
          aria-labelledby="mvcare-what-title"
        >
          <div className="mvcare-section__inner">
            <div className="mvcare-what__grid">
              <div className="mvcare-what__intro">
                <p className="section-label mvcare-reveal">
                  {mvcareWhatIs.eyebrow}
                </p>
                <h2
                  id="mvcare-what-title"
                  className="section-title mvcare-what__title mvcare-title-display"
                >
                  <span className="mvcare-title-reveal">
                    <span className="mvcare-what__title-line">
                      {mvcareWhatIs.titleLine1}
                    </span>
                    <span className="mvcare-what__title-line">
                      {mvcareWhatIs.titleLine2Before}
                      <span className="mvcare-what__title-highlight">
                        {mvcareWhatIs.titleLine2Highlight}
                      </span>
                    </span>
                  </span>
                </h2>
              </div>
              <div className="mvcare-what__body mvcare-reveal">
                {mvcareWhatIs.paragraphs.map((paragraph) =>
                  typeof paragraph === "string" ? (
                    <p key={paragraph} className="section-body">
                      {paragraph}
                    </p>
                  ) : (
                    <p key={paragraph.highlight} className="section-body">
                      {paragraph.before}
                      <span className="mvcare-what__highlight">
                        {paragraph.highlight}
                      </span>
                      {paragraph.after}
                    </p>
                  ),
                )}
                <Link
                  href={mvcareWhatIs.ritmoLink.href}
                  className="mvcare-link"
                >
                  {mvcareWhatIs.ritmoLink.label}
                  <span className="mvcare-link__arrow" aria-hidden={true}>
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <MvcareFeaturesCarousel />

        <MvcareBenefits />

        <section
          id="mvcare-empezar"
          className="mvcare-section mvcare-section--light mvcare-start"
          aria-labelledby="mvcare-start-title"
        >
          <div className="mvcare-section__inner mvcare-start__inner">
            <header className="mvcare-start__head mvcare-reveal">
              <p className="section-label">{mvcareStart.eyebrow}</p>
              <h2 id="mvcare-start-title" className="section-title">
                {mvcareStart.title}
              </h2>
              <p className="section-body mvcare-start__subtitle">
                {mvcareStart.subtitle}
              </p>
            </header>

            <div className="mvcare-start__grid mvcare-reveal">
              <ol className="mvcare-steps__list">
                {mvcareSteps.map((step) => (
                  <li key={step.number} className="mvcare-steps__item">
                    <span className="mvcare-steps__num" aria-hidden={true}>
                      {step.number}
                    </span>
                    <div className="mvcare-steps__copy">
                      <h3 className="mvcare-steps__title">{step.title}</h3>
                      <p className="section-body">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mvcare-start__faq">
                <MvcareFaq items={mvcareFaq} />
              </div>
            </div>
          </div>
        </section>

        <section
          className="mvcare-section mvcare-section--close"
          aria-labelledby="mvcare-close-title"
        >
          <div className="mvcare-section__inner mvcare-close mvcare-reveal">
            <h2 id="mvcare-close-title" className="section-title mvcare-close__title">
              {mvcareClose.title}
            </h2>
            <p className="section-body mvcare-close__body">{mvcareClose.body}</p>
            <MvcareCta variant="close" />
          </div>
        </section>
      </main>
    </>
  );
}
