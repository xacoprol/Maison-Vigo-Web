"use client";

import Image from "next/image";
import { useKeenSlider } from "keen-slider/react";
import { useCallback, useState, useSyncExternalStore } from "react";

import { espacioPanels } from "@/lib/espacio-panels";

import "keen-slider/keen-slider.min.css";

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

type CarouselArrowProps = {
  direction: "prev" | "next";
  disabled?: boolean;
  onClick: () => void;
};

function CarouselArrow({ direction, disabled, onClick }: CarouselArrowProps) {
  const src =
    direction === "prev"
      ? "/assets/images/iconos/arrow-left.svg"
      : "/assets/images/iconos/arrow-right.svg";
  const label =
    direction === "prev" ? "Espacio anterior" : "Espacio siguiente";

  return (
    <button
      type="button"
      className="espacio-mobile__arrow"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={14}
        height={14}
        className="espacio-mobile__arrow-icon"
      />
    </button>
  );
}

export function EspacioMobileSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  const [sliderRef, sliderRefApi] = useKeenSlider<HTMLDivElement>(
    {
      loop: false,
      mode: "snap",
      rubberband: true,
      drag: !reducedMotion,
      slides: {
        perView: 1,
        spacing: 0,
        origin: "center",
      },
      defaultAnimation: {
        duration: reducedMotion ? 0 : 480,
        easing: (t) => 1 - (1 - t) ** 3,
      },
      created(slider) {
        setActiveIndex(slider.track.details.rel);
      },
      slideChanged(slider) {
        setActiveIndex(slider.track.details.rel);
      },
    },
    [],
  );

  const goPrev = useCallback(() => {
    sliderRefApi.current?.prev();
  }, [sliderRefApi]);

  const goNext = useCallback(() => {
    sliderRefApi.current?.next();
  }, [sliderRefApi]);

  const lastIndex = espacioPanels.length - 1;

  return (
    <section
      className="espacio-mobile"
      data-espacio-mobile
      aria-label="Espacio editorial Maison Vigo"
    >
      <div className="espacio-mobile__carousel">
        <div ref={sliderRef} className="espacio-mobile__slider keen-slider">
          {espacioPanels.map((panel) => (
            <article
              key={panel.id}
              className="espacio-mobile__slide keen-slider__slide"
            >
              <div className="espacio-mobile__slide-inner">
                <div className="espacio-mobile__visual">
                  <figure className="espacio-mobile__figure">
                    <Image
                      src={panel.image}
                      alt={panel.imageAlt}
                      fill
                      sizes="(max-width: 900px) 100vw, 0px"
                      className="espacio-mobile__image"
                      quality={75}
                    />
                  </figure>

                  <h2 className="espacio-mobile__title">{panel.title}</h2>
                </div>

                <p className="espacio-mobile__body">
                  <span
                    className="espacio-mobile__body-offset"
                    aria-hidden={true}
                  />
                  {panel.body}
                </p>
              </div>
            </article>
          ))}
        </div>

        <nav
          className="espacio-mobile__nav"
          aria-label="Navegación del espacio"
        >
          <CarouselArrow
            direction="prev"
            disabled={activeIndex <= 0}
            onClick={goPrev}
          />
          <CarouselArrow
            direction="next"
            disabled={activeIndex >= lastIndex}
            onClick={goNext}
          />
        </nav>
      </div>
    </section>
  );
}
