import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getServicioSlideshowSlides } from "@/lib/servicio-slideshow-data";
import { getServicio, servicioSlugs } from "@/lib/servicios-data";
import { siteConfig } from "@/lib/site-config";

import { ServicioBackNav } from "./servicio-back-nav";
import { ServicioBodyText } from "./servicio-body-text";
import { ServicioEffects } from "./servicio-effects";
import { ServicioHeroBg } from "./servicio-hero-bg";
import { ServicioPageClient } from "./servicio-page-client";
import { ServicioScrollCarousel } from "./servicio-scroll-carousel";
import { ServicioServiciosSection } from "./servicio-servicios-section";
import "./servicio.css";

type Params = { slug: string };

export function generateStaticParams() {
  return servicioSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const servicio = getServicio(slug);
  if (!servicio) return {};
  return {
    title: servicio.title,
    description: servicio.subtitle,
    alternates: { canonical: `/servicios/${servicio.slug}` },
    openGraph: {
      title: `${servicio.title} — ${siteConfig.shortName}`,
      description: servicio.subtitle,
      url: `/servicios/${servicio.slug}`,
      images: [{ url: servicio.image }],
    },
  };
}

export default async function ServicioPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const servicio = getServicio(slug);
  if (!servicio) notFound();

  return (
    <ServicioPageClient>
    <main className="servicio">
      <ServicioEffects />
      <section
        className="servicio__hero"
        aria-label={`Servicio: ${servicio.title}`}
      >
        <div className="servicio__hero-media">
          <ServicioHeroBg src={servicio.image} alt={servicio.imageAlt} />
          <span className="servicio__hero-overlay" aria-hidden={true} />
        </div>

        <div className="servicio__hero-inner">
          <div className="servicio__hero-title-block">
            <h1 className="servicio__hero-title">
              <span className="servicio__hero-title-reveal">
                {servicio.title}
              </span>
            </h1>
            {servicio.bodyLogo ? (
              <span
                className="servicio__hero-logo-reveal"
                aria-hidden={true}
              >
                <img
                  src={servicio.bodyLogo.src}
                  alt=""
                  className="servicio__hero-logo"
                />
              </span>
            ) : null}
          </div>
          <div className="servicio__hero-lead-wrap">
            <p className="servicio__hero-lead">{servicio.subtitle}</p>
          </div>
        </div>

        <div
          id="servicio-body"
          className="servicio__hero-body"
          aria-label={`Sobre ${servicio.title}`}
        >
          <ServicioBodyText key={servicio.slug}>{servicio.body}</ServicioBodyText>
        </div>

        <a
          href="#servicio-body"
          className="servicio__scroll-cta"
          aria-label="Bajar al texto del servicio"
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
                width={16}
                height={16}
                className="servicio__scroll-cta-arrow servicio__scroll-cta-arrow--top"
              />
              <img
                src="/assets/images/iconos/arrow-down.svg"
                alt=""
                width={16}
                height={16}
                className="servicio__scroll-cta-arrow servicio__scroll-cta-arrow--bottom"
              />
            </span>
          </span>
        </a>
      </section>

      <ServicioScrollCarousel
        key={servicio.slug}
        slides={getServicioSlideshowSlides(servicio.slug)}
      />

      <ServicioServiciosSection slug={servicio.slug} />
    </main>
    <ServicioBackNav currentTitle={servicio.title} />
    </ServicioPageClient>
  );
}
