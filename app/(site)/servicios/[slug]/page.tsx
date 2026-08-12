import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { groomingFaq } from "@/lib/grooming-faq";
import { getServicioSlideshowSlides } from "@/lib/servicio-slideshow-data";
import { getServicio, servicioSlugs } from "@/lib/servicios-data";
import { siteConfig, siteUrl } from "@/lib/site-config";

import { ServicioBackNav } from "./servicio-back-nav";
import { ServicioBodyText } from "./servicio-body-text";
import { ServicioEffects } from "./servicio-effects";
import { ServicioHeroBg } from "./servicio-hero-bg";
import { ServicioAcompanamientoCta } from "./servicio-acompanamiento-cta";
import { ServicioAcompanamientoHow } from "./servicio-acompanamiento-how";
import { ServicioBodaVideos } from "./servicio-boda-videos";
import { ServicioGroomingFaq } from "./servicio-grooming-faq";
import { ServicioGroomingSeoCopy } from "./servicio-grooming-seo";
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

  if (servicio.slug === "grooming") {
    const title = "Grooming — Peluquería canina en Vigo";
    const description =
      "Grooming y peluquería canina en Vigo: baño, corte, deslanado y dermocosmética con calma y técnica en Maison Vigo.";
    return {
      title,
      description,
      alternates: { canonical: `/servicios/${servicio.slug}` },
      openGraph: {
        title: `${title} | ${siteConfig.shortName}`,
        description,
        url: `/servicios/${servicio.slug}`,
        images: [{ url: servicio.image, alt: servicio.imageAlt }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | ${siteConfig.shortName}`,
        description,
        images: [servicio.image],
      },
    };
  }

  const description = servicio.subtitle.replace(/\n/g, " ");
  return {
    title: servicio.title,
    description,
    alternates: { canonical: `/servicios/${servicio.slug}` },
    openGraph: {
      title: `${servicio.title} — ${siteConfig.shortName}`,
      description,
      url: `/servicios/${servicio.slug}`,
      images: [{ url: servicio.image, alt: servicio.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${servicio.title} — ${siteConfig.shortName}`,
      description,
      images: [servicio.image],
    },
  };
}

function GroomingFaqJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteUrl}/servicios/grooming#faq`,
    mainEntity: groomingFaq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
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
    {servicio.slug === "grooming" ? <GroomingFaqJsonLd /> : null}
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
            {servicio.slug === "acompanamiento" ? (
              <ServicioAcompanamientoCta />
            ) : null}
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
          aria-label="Desplázate hacia abajo"
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

      {servicio.slug === "grooming" && servicio.seoBody ? (
        <ServicioGroomingSeoCopy paragraphs={servicio.seoBody} />
      ) : null}

      {servicio.slug === "acompanamiento" ? (
        <>
          <ServicioBodaVideos />
          <ServicioAcompanamientoHow />
        </>
      ) : null}

      <ServicioServiciosSection slug={servicio.slug} />
      {servicio.slug === "grooming" ? <ServicioGroomingFaq /> : null}
    </main>
    <ServicioBackNav currentTitle={servicio.title} />
    </ServicioPageClient>
  );
}
