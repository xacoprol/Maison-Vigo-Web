"use client";

import Image from "next/image";
import Link from "next/link";
import { useKeenSlider } from "keen-slider/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { servicioSlugFromLabel } from "@/lib/servicios-data";

import "keen-slider/keen-slider.min.css";

import {
  MOBILE_SLIDE_SPACING,
  MOBILE_SLIDES_PER_VIEW,
  MOBILE_SLIDES_PER_VIEW_NARROW,
  ORDER_MOBILE,
  SERVICE_IMAGE_ALTS,
  SERVICE_IMAGES,
  SERVICE_SUBTITLES,
  ServiceOrbLabel,
  type ServiceId,
} from "./servicios-carousel-shared";

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function updateOrbDepthFromSlider(slider: {
  slides: HTMLElement[];
  track: { details: { slides: { distance: number }[] } };
}) {
  slider.slides.forEach((slide, i) => {
    const detail = slider.track.details.slides[i];
    if (!detail) return;
    const dist = Math.abs(detail.distance);
    if (dist < 0.08) {
      slide.style.transform = "scale(1)";
      slide.style.opacity = "1";
      slide.style.zIndex = "100";
      return;
    }
    const norm = Math.min(1.15, dist * 1.05);
    const scale = Math.max(0.92, 1 - norm * 0.07);
    const opacity = Math.max(0.75, 1 - norm * 0.2);
    slide.style.transform = `scale(${scale})`;
    slide.style.opacity = `${opacity}`;
    slide.style.zIndex = `${Math.max(1, Math.round(80 - norm * 45))}`;
  });
}

export function ServiciosCarouselMobile() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragMovedRef = useRef(false);
  const lenisPausedRef = useRef(false);
  const [photoId, setPhotoId] = useState<ServiceId>("Grooming");

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  const pauseLenis = useCallback(() => {
    if (lenisPausedRef.current) return;
    window.__mvLenis?.stop();
    lenisPausedRef.current = true;
  }, []);

  const resumeLenis = useCallback(() => {
    if (!lenisPausedRef.current) return;
    window.__mvLenis?.start();
    lenisPausedRef.current = false;
  }, []);

  const [sliderRef, sliderRefApi] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      mode: "snap",
      rubberband: true,
      drag: !reducedMotion,
      slides: {
        perView: MOBILE_SLIDES_PER_VIEW,
        spacing: MOBILE_SLIDE_SPACING,
        origin: "center",
      },
      breakpoints: {
        "(max-width: 680px)": {
          slides: {
            perView: MOBILE_SLIDES_PER_VIEW_NARROW,
            spacing: MOBILE_SLIDE_SPACING,
            origin: "center",
          },
        },
      },
      defaultAnimation: {
        duration: reducedMotion ? 0 : 520,
        easing: (t) => 1 - (1 - t) ** 3,
      },
      created(slider) {
        updateOrbDepthFromSlider(slider);
        const label = ORDER_MOBILE[slider.track.details.rel];
        if (label) setPhotoId(label);
      },
      slideChanged(slider) {
        updateOrbDepthFromSlider(slider);
      },
      animationEnded(slider) {
        const label = ORDER_MOBILE[slider.track.details.rel];
        if (label) setPhotoId(label);
      },
      dragged(slider) {
        updateOrbDepthFromSlider(slider);
      },
      dragStarted() {
        dragMovedRef.current = false;
        rootRef.current?.classList.add("is-dragging");
        pauseLenis();
      },
      dragChecked() {
        dragMovedRef.current = true;
      },
      dragEnded() {
        rootRef.current?.classList.remove("is-dragging");
        resumeLenis();
      },
    },
  );

  useEffect(() => {
    ORDER_MOBILE.forEach((label) => {
      const img = new window.Image();
      img.src = SERVICE_IMAGES[label];
    });
  }, []);

  useEffect(() => {
    const slider = sliderRefApi.current;
    if (!slider) return;

    const update = () => slider.update();
    const ro = new ResizeObserver(update);
    const vp = rootRef.current?.querySelector(".servicios-carousel__viewport");
    if (vp) ro.observe(vp);
    window.addEventListener("resize", update);
    document.fonts?.ready.then(update);

    const onIntroComplete = () => update();
    document.body.addEventListener("mv-intro-complete", onIntroComplete);

    const revealLayer = document.querySelector(
      ".servicios-carousel-wrap.reveal",
    );
    const revealObserver =
      revealLayer &&
      new MutationObserver(() => {
        if (revealLayer.classList.contains("visible")) update();
      });
    if (revealLayer && revealObserver) {
      revealObserver.observe(revealLayer, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    const section = document.getElementById("servicios");
    const io =
      section &&
      new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) update();
        },
        { rootMargin: "20% 0px", threshold: 0 },
      );
    if (section && io) io.observe(section);

    return () => {
      ro.disconnect();
      revealObserver?.disconnect();
      io?.disconnect();
      window.removeEventListener("resize", update);
      document.body.removeEventListener("mv-intro-complete", onIntroComplete);
      resumeLenis();
    };
  }, [sliderRefApi, resumeLenis]);

  return (
    <div
      ref={rootRef}
      className="servicios-carousel"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Cuidado integral destacado"
    >
      <div className="servicios-carousel__photo-panel" aria-hidden={true}>
        {ORDER_MOBILE.map((label) => (
          <div
            key={label}
            className={
              "servicios-carousel__photo-layer" +
              (photoId === label ? " is-active" : "")
            }
          >
            <Image
              src={SERVICE_IMAGES[label]}
              alt={SERVICE_IMAGE_ALTS[label]}
              fill
              className="servicios-carousel__photo-img"
              sizes="(max-width: 900px) min(98vw, 640px), min(1180px, 98vw)"
              quality={75}
              priority={label === "Grooming"}
            />
          </div>
        ))}
      </div>

      <div
        className="servicios-carousel__viewport"
      >
        <div
          ref={sliderRef}
          className="servicios-carousel__track servicios-carousel__track--keen keen-slider"
        >
          {ORDER_MOBILE.map((label) => (
            <div
              key={label}
              className="servicios-carousel__cell keen-slider__slide"
              data-service={label}
            >
              <Link
                href={`/servicios/${servicioSlugFromLabel(label) ?? ""}`}
                className="servicios-carousel__orb"
                aria-label={`${label}. ${SERVICE_SUBTITLES[label]}`}
                onClick={(event) => {
                  if (dragMovedRef.current) event.preventDefault();
                }}
              >
                <svg
                  className="servicios-carousel__ring"
                  viewBox="0 0 100 100"
                  aria-hidden={true}
                >
                  <circle
                    className="servicios-carousel__ring-path"
                    cx="50"
                    cy="50"
                    r="50"
                  />
                </svg>
                <span className="servicios-carousel__badge" aria-hidden={true}>
                  <span className="servicios-carousel__badge-disc" />
                  <svg
                    className="servicios-carousel__plus"
                    viewBox="0 0 30 30"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden={true}
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      d="M15 9v12M9 15h12"
                    />
                  </svg>
                </span>
                <span className="servicios-carousel__orb-text">
                  <ServiceOrbLabel label={label} />
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
