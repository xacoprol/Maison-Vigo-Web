"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  mvcareFeatures,
  mvcareFeaturesSection,
} from "@/lib/mvcare-content";

const SLIDE_COUNT = mvcareFeatures.length;

type CarouselArrowProps = {
  direction: "prev" | "next";
  onClick: () => void;
};

function CarouselArrow({ direction, onClick }: CarouselArrowProps) {
  const src =
    direction === "prev"
      ? "/assets/images/iconos/arrow-left.svg"
      : "/assets/images/iconos/arrow-right.svg";
  const label =
    direction === "prev" ? "Diapositiva anterior" : "Diapositiva siguiente";

  return (
    <button
      type="button"
      className="mvcare-features__arrow servicio__scroll-cta"
      aria-label={label}
      onClick={onClick}
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
        <span className="servicio__scroll-cta-arrow-wrap" aria-hidden={true}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            width={14}
            height={14}
            className="servicio__scroll-cta-arrow mvcare-features__arrow-icon"
          />
        </span>
      </span>
    </button>
  );
}

export function MvcareFeaturesCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const go = useCallback((delta: number) => {
    setIndex((prev) => (prev + delta + SLIDE_COUNT) % SLIDE_COUNT);
  }, []);

  useEffect(() => {
    const root = carouselRef.current;
    if (!root) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (!root.matches(":hover") && !root.contains(document.activeElement)) {
        return;
      }
      event.preventDefault();
      go(event.key === "ArrowLeft" ? -1 : 1);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const active = mvcareFeatures[index];
  const secondary = mvcareFeatures[(index + 1) % SLIDE_COUNT];

  return (
    <section
      className="mvcare-section mvcare-section--dark mvcare-features"
      aria-labelledby="mvcare-features-title"
      aria-roledescription="carrusel"
    >
      <div className="mvcare-section__inner mvcare-features__inner">
        <header className="mvcare-features__masthead mvcare-reveal">
          <h2
            id="mvcare-features-title"
            className="servicios-heading__title mvcare-features__masthead-title"
          >
            {mvcareFeaturesSection.masthead}
          </h2>
          <p className="section-label mvcare-features__masthead-sub">
            {mvcareFeaturesSection.subtitle}
          </p>
        </header>

        <div
          ref={carouselRef}
          className="mvcare-features__carousel"
          role="region"
          aria-label="Funciones de MV Care"
          tabIndex={0}
        >
          <div className="mvcare-features__body">
            <div className="mvcare-features__copy-col">
              <div className="mvcare-features__copy-viewport">
                <div
                  className="mvcare-features__copy-track"
                  style={{
                    transform: `translate3d(-${index * 100}%, 0, 0)`,
                  }}
                >
                  {mvcareFeatures.map((feature, slideIndex) => (
                    <article
                      key={feature.title}
                      className="mvcare-features__copy-panel"
                      aria-hidden={slideIndex !== index}
                    >
                      <p className="section-label mvcare-features__slide-label">
                        {mvcareFeaturesSection.slideLabel}
                      </p>
                      <h3 className="mvcare-features__slide-title">
                        {feature.title}
                      </h3>
                      <p className="section-body mvcare-features__slide-desc">
                        {feature.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="mvcare-features__nav">
                <CarouselArrow direction="prev" onClick={() => go(-1)} />
                <p className="mvcare-features__counter" aria-live="polite">
                  <span className="mvcare-features__counter-current">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mvcare-features__counter-sep" aria-hidden={true}>
                    {" "}
                    /{" "}
                  </span>
                  <span className="mvcare-features__counter-total">
                    {String(SLIDE_COUNT).padStart(2, "0")}
                  </span>
                </p>
                <CarouselArrow direction="next" onClick={() => go(1)} />
              </div>
            </div>

            <div className="mvcare-features__visual-col">
              <span className="mvcare-features__numeral" aria-hidden={true}>
                {index + 1}
              </span>

              <div className="mvcare-features__images">
                <div className="mvcare-features__image-layer mvcare-features__image-layer--main">
                  <Image
                    key={active.image}
                    src={active.image}
                    alt={active.imageAlt}
                    fill
                    className="mvcare-features__image"
                    sizes="(max-width: 900px) 92vw, 55vw"
                    priority={index === 0}
                  />
                </div>
                <div className="mvcare-features__image-layer mvcare-features__image-layer--secondary">
                  <Image
                    key={secondary.image}
                    src={secondary.image}
                    alt=""
                    fill
                    className="mvcare-features__image"
                    sizes="(max-width: 900px) 40vw, 22vw"
                    aria-hidden={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
