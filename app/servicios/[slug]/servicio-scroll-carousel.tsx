"use client";

import { useEffect, useRef } from "react";

import type { ServicioSlideshowSlide } from "@/lib/servicio-slideshow-data";
import { SERVICIO_SLIDESHOW_SLIDES } from "@/lib/servicio-slideshow-data";
import { bindLenisScrollTrigger } from "@/lib/servicio-lenis-scroll-trigger";

import "./servicio-scroll-carousel.css";

const GSAP_URL =
  "https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js";
const SCROLL_TRIGGER_URL =
  "https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/ScrollTrigger.min.js";
const DESKTOP_MQ = "(min-width: 1024px)";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function loadGsap() {
  if (window.gsap && window.ScrollTrigger) {
    return { gsap: window.gsap, ScrollTrigger: window.ScrollTrigger };
  }
  await loadScript(GSAP_URL);
  await loadScript(SCROLL_TRIGGER_URL);
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) {
    throw new Error("GSAP failed to load");
  }
  gsap.registerPlugin(ScrollTrigger);
  return { gsap, ScrollTrigger };
}

type ServicioScrollCarouselProps = {
  slides?: ServicioSlideshowSlide[];
};

export function ServicioScrollCarousel({
  slides = SERVICIO_SLIDESHOW_SLIDES,
}: ServicioScrollCarouselProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const pin = pinRef.current;
    if (!wrap || !pin) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const desktopMq = window.matchMedia(DESKTOP_MQ);

    if (!desktopMq.matches || prefersReducedMotion) {
      wrap.classList.add("servicio-slideshow-wrap--mobile-all");
      return;
    }

    let killed = false;
    let timeline: { kill: () => void } | null = null;
    let didInit = false;

    const init = async () => {
      if (didInit) return;
      try {
        const { gsap, ScrollTrigger } = await loadGsap();
        if (killed || !wrapRef.current || !pinRef.current) return;

        window.ScrollTrigger?.getById("servicio-slideshow")?.kill();
        timeline?.kill();

        bindLenisScrollTrigger(ScrollTrigger);

        const root = wrapRef.current;
        const pinEl = pinRef.current;

        const captions = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(".servicio-slideshow__caption"),
        );
        const headlineLine1 = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(
            ".servicio-slideshow__headline-row--1 .servicio-slideshow__headline-line-item",
          ),
        );
        const headlineLine2 = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(
            ".servicio-slideshow__headline-row--2 .servicio-slideshow__headline-line-item",
          ),
        );
        const headlineLinesBySlide = (slideIndex: number) => [
          headlineLine1[slideIndex],
          headlineLine2[slideIndex],
        ];
        const clips = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(".servicio-slideshow__media-clip"),
        );
        const images = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(".servicio-slideshow__media-slide img"),
        );
        const slideEls = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(".servicio-slideshow__media-slide"),
        );

        const setActiveStep = (index: number) => {
          stepsRef.current
            ?.querySelectorAll<HTMLElement>(".servicio-slideshow__step")
            .forEach((step, i) => {
              const isActive = i === index;
              step.classList.toggle("is-active", isActive);
              step.setAttribute("aria-current", isActive ? "step" : "false");
            });
        };

        gsap.set(captions, { opacity: 0 });
        gsap.set(captions[0], { opacity: 1 });
        gsap.set(clips, { clipPath: "inset(100% 0% 0% 0%)" });
        gsap.set(clips[0], { clipPath: "inset(0% 0% 0% 0%)" });
        gsap.set(images, { scale: 1.15, transformOrigin: "center center" });
        gsap.set(slideEls, { zIndex: 1 });
        gsap.set(slideEls[0], { zIndex: 3 });

        const SEG = 1;
        /** Duración del cruce entre diapos (scrub): más alto = cambio más lento. */
        const TRANS = 0.4;
        const HEADLINE_TRANS = 0.48;
        const HEADLINE_EASE = "power1.inOut";
        /** Más allá de ±100 % (tildes/ascendentes fuera de la caja de línea). */
        const HEADLINE_OFF = 138;
        const scrollDistance = () => window.innerHeight * 3;

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            id: "servicio-slideshow",
            trigger: root,
            pin: pinEl,
            pinSpacing: true,
            start: "top top",
            end: () => `+=${scrollDistance()}`,
            scrub: true,
            anticipatePin: 0,
            invalidateOnRefresh: false,
            onUpdate: (self: { progress: number }) => {
              const idx = Math.min(
                2,
                Math.max(0, Math.floor(self.progress * 2.999)),
              );
              setActiveStep(idx);
            },
          },
        });

        timeline = tl;

        tl.to(images[0], { scale: 1, duration: SEG * 0.8 }, 0);

        const headlineEl = root.querySelector<HTMLElement>(
          ".servicio-slideshow__headline",
        );
        const headlineRows = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(".servicio-slideshow__headline-row"),
        );

        const syncHeadlineRowHeights = () => {
          headlineRows.forEach((row) => {
            const items = row.querySelectorAll<HTMLElement>(
              ".servicio-slideshow__headline-line-item",
            );
            let maxH = 0;
            items.forEach((item) => {
              maxH = Math.max(maxH, item.getBoundingClientRect().height);
            });
            if (maxH > 0) row.style.minHeight = `${Math.ceil(maxH) + 10}px`;
          });
        };

        syncHeadlineRowHeights();

        const slideCount = headlineLine1.length;
        const headlineYForSlide = (lineIndex: number, activeSlide: number) => {
          if (lineIndex === activeSlide) return 0;
          if (lineIndex < activeSlide) return -HEADLINE_OFF;
          return HEADLINE_OFF;
        };

        /** Estados fijos en la timeline (scrub no usa gsap.set fuera del tl). */
        const lockHeadlineSlide = (activeSlide: number, at: number) => {
          for (let i = 0; i < slideCount; i += 1) {
            const y = headlineYForSlide(i, activeSlide);
            const z = i === activeSlide ? 2 : 1;
            tl.set(
              [headlineLine1[i], headlineLine2[i]],
              { yPercent: y, zIndex: z, opacity: 1 },
              at,
            );
          }
        };

        const pushHeadlineSlide = (from: number, to: number, at: number) => {
          const pushAt = at - HEADLINE_TRANS;
          const fromLines = headlineLinesBySlide(from);
          const toLines = headlineLinesBySlide(to);

          fromLines.forEach((el) => {
            tl.fromTo(
              el,
              { yPercent: 0 },
              {
                yPercent: -HEADLINE_OFF,
                duration: HEADLINE_TRANS,
                ease: HEADLINE_EASE,
              },
              pushAt,
            );
          });
          toLines.forEach((el) => {
            tl.fromTo(
              el,
              { yPercent: HEADLINE_OFF },
              { yPercent: 0, duration: HEADLINE_TRANS, ease: HEADLINE_EASE },
              pushAt,
            );
          });
          tl.set(toLines, { zIndex: 3 }, pushAt);
          tl.set(fromLines, { zIndex: 1 }, at);
        };

        lockHeadlineSlide(0, 0);

        const transitionTo = (from: number, to: number, at: number) => {
          tl.to(
            captions[from],
            { opacity: 0, duration: TRANS * 0.5, ease: "power1.inOut" },
            at - TRANS,
          );
          pushHeadlineSlide(from, to, at);
          lockHeadlineSlide(to, at);
          tl.set(slideEls[to], { zIndex: 4 }, at - TRANS * 0.15);
          tl.fromTo(
            clips[to],
            { clipPath: "inset(100% 0% 0% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: TRANS * 1.4,
              ease: "power2.inOut",
            },
            at - TRANS * 0.1,
          );
          tl.fromTo(
            images[to],
            { scale: 1.15 },
            { scale: 1, duration: SEG * 0.8 },
            at,
          );
          tl.fromTo(
            captions[to],
            { opacity: 0 },
            { opacity: 1, duration: TRANS * 0.65, ease: "power1.out" },
            at + TRANS * 0.08,
          );
        };

        transitionTo(0, 1, SEG);
        transitionTo(1, 2, SEG * 2);
        tl.to(images[2], { scale: 1, duration: SEG * 0.8 }, SEG * 2);

        setActiveStep(0);
        ScrollTrigger.refresh();
        headlineEl?.classList.add("servicio-slideshow__headline--ready");
        didInit = true;
      } catch {
        wrap.classList.add("servicio-slideshow-wrap--mobile-all");
      }
    };

    const startTimer = window.setTimeout(() => {
      void init();
    }, 320);

    const onResize = () => {
      if (!desktopMq.matches) {
        window.ScrollTrigger?.getById("servicio-slideshow")?.kill();
        timeline?.kill();
        wrap.classList.add("servicio-slideshow-wrap--mobile-all");
      }
    };
    desktopMq.addEventListener("change", onResize);

    return () => {
      killed = true;
      window.clearTimeout(startTimer);
      desktopMq.removeEventListener("change", onResize);
      timeline?.kill();
      window.ScrollTrigger?.getById("servicio-slideshow")?.kill();
      wrapRef.current
        ?.querySelector(".servicio-slideshow__headline")
        ?.classList.remove("servicio-slideshow__headline--ready");
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="servicio-slideshow-wrap"
      aria-label="Galería del servicio"
    >
      <section ref={pinRef} className="servicio-slideshow">
        <div className="servicio-slideshow__layout">
          <div className="servicio-slideshow__dark">
            {slides.map((slide, index) => (
              <p
                key={`caption-${index}`}
                className={`servicio-slideshow__caption servicio-slideshow__caption--${index}`}
              >
                {slide.caption}
              </p>
            ))}
            <nav
              ref={stepsRef}
              className="servicio-slideshow__steps"
              aria-label="Diapositivas"
              aria-live="polite"
            >
              {slides.map((slide, index) => (
                <div
                  key={`step-${index}`}
                  className={
                    "servicio-slideshow__step" +
                    (index === 0 ? " is-active" : "")
                  }
                  aria-current={index === 0 ? "step" : undefined}
                >
                  <span className="servicio-slideshow__step-num">{index + 1}</span>
                </div>
              ))}
            </nav>
          </div>

          <div className="servicio-slideshow__media">
            <div className="servicio-slideshow__media-viewport">
              {slides.map((slide, index) => (
                <div
                  key={`media-${index}`}
                  className={
                    "servicio-slideshow__media-slide" +
                    ` servicio-slideshow__media-slide--${index}`
                  }
                >
                  <div className="servicio-slideshow__media-clip">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slide.image} alt={slide.imageAlt} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="servicio-slideshow__headline">
          <div className="servicio-slideshow__headline-rows">
            <div className="servicio-slideshow__headline-row servicio-slideshow__headline-row--1">
              {slides.map((slide, index) => (
                <span
                  key={`headline-1-${index}`}
                  className={
                    "servicio-slideshow__headline-line-item" +
                    " servicio-slideshow__headline-line" +
                    " servicio-slideshow__headline-line--solid" +
                    ` servicio-slideshow__headline-line-item--${index}`
                  }
                >
                  {slide.headline1}
                </span>
              ))}
            </div>
            <div className="servicio-slideshow__headline-row servicio-slideshow__headline-row--2">
              {slides.map((slide, index) => (
                <span
                  key={`headline-2-${index}`}
                  className={
                    "servicio-slideshow__headline-line-item" +
                    " servicio-slideshow__headline-line" +
                    " servicio-slideshow__headline-line--accent" +
                    ` servicio-slideshow__headline-line-item--${index}`
                  }
                >
                  {slide.headline2}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
