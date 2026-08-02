"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ServicioSlideshowSlide } from "@/lib/servicio-slideshow-data";
import { SERVICIO_SLIDESHOW_SLIDES } from "@/lib/servicio-slideshow-data";
import { bindLenisScrollTrigger } from "@/lib/servicio-lenis-scroll-trigger";

import "./servicio-scroll-carousel.css";

const GSAP_URL =
  "https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js";
const SCROLL_TRIGGER_URL =
  "https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/ScrollTrigger.min.js";
const DESKTOP_MQ = "(min-width: 1024px)";
const SWIPE_THRESHOLD_PX = 48;
const SWIPE_MAX_VERTICAL_PX = 72;

function killSlideshowScrollTrigger(revert = true) {
  window.ScrollTrigger?.getById("servicio-slideshow")?.kill(revert);
}

function clearSlideshowGsapStyles(root: HTMLElement) {
  const gsap = window.gsap;
  if (!gsap) return;

  gsap.set(
    root.querySelectorAll(
      ".servicio-slideshow__caption, .servicio-slideshow__media-clip, .servicio-slideshow__media-slide, .servicio-slideshow__media-slide img, .servicio-slideshow__headline-line-item",
    ),
    { clearProps: "all" },
  );
}

function clearSlideshowInlineStyles(root: HTMLElement) {
  root
    .querySelectorAll<HTMLElement>(".servicio-slideshow__headline-line-item")
    .forEach((el) => {
      el.style.display = "";
    });
  root
    .querySelectorAll<HTMLElement>(".servicio-slideshow__headline-row")
    .forEach((el) => {
      el.style.minHeight = "";
    });
}

const MOBILE_TRANS = 0.55;
const MOBILE_HEADLINE_TRANS = 0.48;
const MOBILE_HEADLINE_EASE = "power1.inOut";
const MOBILE_HEADLINE_OFF = 138;

function slideshowProgressForIndex(index: number, slideCount: number) {
  return slideCount <= 1 ? 0 : index / (slideCount - 1);
}

function slideshowIndexFromProgress(progress: number, slideCount: number) {
  if (slideCount <= 1) return 0;
  return Math.min(
    slideCount - 1,
    Math.floor(progress * (slideCount - 1) + 0.001),
  );
}

type SlideshowElements = {
  captions: HTMLElement[];
  headlineLine1: HTMLElement[];
  headlineLine2: HTMLElement[];
  clips: HTMLElement[];
  images: HTMLElement[];
  slideEls: HTMLElement[];
};

function getSlideshowElements(root: HTMLElement): SlideshowElements {
  const gsap = window.gsap;
  const toArray = gsap?.utils.toArray ?? Array.from;
  return {
    captions: toArray<HTMLElement>(
      root.querySelectorAll(".servicio-slideshow__caption"),
    ),
    headlineLine1: toArray<HTMLElement>(
      root.querySelectorAll(
        ".servicio-slideshow__headline-row--1 .servicio-slideshow__headline-line-item",
      ),
    ),
    headlineLine2: toArray<HTMLElement>(
      root.querySelectorAll(
        ".servicio-slideshow__headline-row--2 .servicio-slideshow__headline-line-item",
      ),
    ),
    clips: toArray<HTMLElement>(
      root.querySelectorAll(".servicio-slideshow__media-clip"),
    ),
    images: toArray<HTMLElement>(
      root.querySelectorAll(".servicio-slideshow__media-slide img"),
    ),
    slideEls: toArray<HTMLElement>(
      root.querySelectorAll(".servicio-slideshow__media-slide"),
    ),
  };
}

function syncHeadlineRowHeights(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".servicio-slideshow__headline-row").forEach(
    (row) => {
      const items = row.querySelectorAll<HTMLElement>(
        ".servicio-slideshow__headline-line-item",
      );
      let maxH = 0;
      items.forEach((item) => {
        maxH = Math.max(maxH, item.getBoundingClientRect().height);
      });
      if (maxH > 0) row.style.minHeight = `${Math.ceil(maxH) + 10}px`;
    },
  );
}

function syncCaptionStackHeight(root: HTMLElement) {
  const stack = root.querySelector<HTMLElement>(
    ".servicio-slideshow__caption-stack",
  );
  if (!stack) return;

  /* En móvil el stack es grid superpuesto: el alto lo marca el caption más largo. */
  if (root.classList.contains("servicio-slideshow-wrap--mobile-all")) {
    stack.style.minHeight = "";
    return;
  }

  let maxH = 0;
  stack.querySelectorAll<HTMLElement>(".servicio-slideshow__caption").forEach(
    (caption) => {
      const prev = {
        position: caption.style.position,
        visibility: caption.style.visibility,
        opacity: caption.style.opacity,
        display: caption.style.display,
      };
      caption.style.position = "static";
      caption.style.visibility = "hidden";
      caption.style.opacity = "1";
      caption.style.display = "block";
      maxH = Math.max(maxH, caption.offsetHeight);
      caption.style.position = prev.position;
      caption.style.visibility = prev.visibility;
      caption.style.opacity = prev.opacity;
      caption.style.display = prev.display;
    },
  );

  if (maxH > 0) stack.style.minHeight = `${maxH}px`;
}

function headlineLinesBySlide(
  slideIndex: number,
  headlineLine1: HTMLElement[],
  headlineLine2: HTMLElement[],
) {
  return [headlineLine1[slideIndex], headlineLine2[slideIndex]];
}

function headlineYForSlide(
  lineIndex: number,
  activeSlide: number,
  headlineOff = MOBILE_HEADLINE_OFF,
) {
  if (lineIndex === activeSlide) return 0;
  if (lineIndex < activeSlide) return -headlineOff;
  return headlineOff;
}

function lockHeadlineSlide(
  gsap: NonNullable<typeof window.gsap>,
  headlineLine1: HTMLElement[],
  headlineLine2: HTMLElement[],
  activeSlide: number,
  headlineOff = MOBILE_HEADLINE_OFF,
) {
  for (let i = 0; i < headlineLine1.length; i += 1) {
    const y = headlineYForSlide(i, activeSlide, headlineOff);
    const z = i === activeSlide ? 2 : 1;
    gsap.set([headlineLine1[i], headlineLine2[i]], {
      yPercent: y,
      zIndex: z,
      opacity: 1,
    });
  }
}

type SlideshowTimeline = {
  to: (...args: any[]) => any;
  set: (...args: any[]) => any;
  fromTo: (...args: any[]) => any;
};

function pushHeadlineSlide(
  tl: SlideshowTimeline,
  from: number,
  to: number,
  headlineLine1: HTMLElement[],
  headlineLine2: HTMLElement[],
  at: number,
  headlineTrans = MOBILE_HEADLINE_TRANS,
  headlineEase = MOBILE_HEADLINE_EASE,
  headlineOff = MOBILE_HEADLINE_OFF,
) {
  const pushAt = at - headlineTrans;
  const fromLines = headlineLinesBySlide(from, headlineLine1, headlineLine2);
  const toLines = headlineLinesBySlide(to, headlineLine1, headlineLine2);

  fromLines.forEach((el) => {
    tl.fromTo(
      el,
      { yPercent: 0 },
      {
        yPercent: -headlineOff,
        duration: headlineTrans,
        ease: headlineEase,
      },
      pushAt,
    );
  });
  toLines.forEach((el) => {
    tl.fromTo(
      el,
      { yPercent: headlineOff },
      { yPercent: 0, duration: headlineTrans, ease: headlineEase },
      pushAt,
    );
  });
  tl.set(toLines, { zIndex: 3 }, pushAt);
  tl.set(fromLines, { zIndex: 1 }, at);
}

function lockHeadlineSlideOnTimeline(
  tl: SlideshowTimeline,
  headlineLine1: HTMLElement[],
  headlineLine2: HTMLElement[],
  activeSlide: number,
  at: number,
  headlineOff = MOBILE_HEADLINE_OFF,
) {
  for (let i = 0; i < headlineLine1.length; i += 1) {
    const y = headlineYForSlide(i, activeSlide, headlineOff);
    const z = i === activeSlide ? 2 : 1;
    tl.set([headlineLine1[i], headlineLine2[i]], { yPercent: y, zIndex: z, opacity: 1 }, at);
  }
}

function transitionSlideshowSlides(
  tl: SlideshowTimeline,
  from: number,
  to: number,
  elements: SlideshowElements,
  at: number,
  trans = MOBILE_TRANS,
) {
  const { captions, headlineLine1, headlineLine2, clips, images, slideEls } =
    elements;

  tl.to(
    captions[from],
    { opacity: 0, duration: trans * 0.5, ease: "power1.inOut" },
    at - trans,
  );
  pushHeadlineSlide(tl, from, to, headlineLine1, headlineLine2, at);
  lockHeadlineSlideOnTimeline(
    tl,
    headlineLine1,
    headlineLine2,
    to,
    at,
  );
  /* Entrante encima del saliente; si ambos quedan en el mismo z-index, en móvil no se ve el cambio. */
  tl.set(slideEls[to], { zIndex: 4 }, at - trans);
  tl.set(slideEls[from], { zIndex: 3 }, at - trans);
  tl.fromTo(
    clips[to],
    { clipPath: "inset(100% 0% 0% 0%)" },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: trans,
      ease: "power2.inOut",
    },
    at - trans,
  );
  tl.fromTo(
    images[to],
    { scale: 1.15 },
    { scale: 1, duration: trans, ease: "power1.out" },
    at - trans,
  );
  tl.fromTo(
    captions[to],
    { opacity: 0 },
    { opacity: 1, duration: trans * 0.65, ease: "power1.out" },
    at - trans * 0.35,
  );
  /* Cierra el saliente y deja solo la diapo activa lista para el siguiente wipe. */
  tl.set(slideEls[to], { zIndex: 3 }, at);
  tl.set(slideEls[from], { zIndex: 1 }, at);
  tl.set(clips[from], { clipPath: "inset(100% 0% 0% 0%)" }, at);
  tl.set(images[from], { scale: 1.15 }, at);
}

function setInitialSlideshowState(
  gsap: NonNullable<typeof window.gsap>,
  elements: SlideshowElements,
  activeSlide = 0,
) {
  const { captions, clips, images, slideEls } = elements;

  gsap.set(captions, { opacity: 0 });
  if (captions[activeSlide]) gsap.set(captions[activeSlide], { opacity: 1 });

  gsap.set(clips, { clipPath: "inset(100% 0% 0% 0%)" });
  gsap.set(images, { scale: 1.15, transformOrigin: "center center" });
  gsap.set(slideEls, { zIndex: 1 });

  if (clips[activeSlide]) {
    gsap.set(clips[activeSlide], { clipPath: "inset(0% 0% 0% 0%)" });
    gsap.set(images[activeSlide], { scale: 1 });
    gsap.set(slideEls[activeSlide], { zIndex: 3 });
  }

  lockHeadlineSlide(
    gsap,
    elements.headlineLine1,
    elements.headlineLine2,
    activeSlide,
  );
}

/** Estado visual de media antes de un wipe móvil (evita z-index/clips residuales). */
function prepareMobileMediaFrom(
  gsap: NonNullable<typeof window.gsap>,
  elements: SlideshowElements,
  from: number,
) {
  const { clips, images, slideEls } = elements;
  gsap.set(clips, { clipPath: "inset(100% 0% 0% 0%)" });
  gsap.set(images, { scale: 1.15, transformOrigin: "center center" });
  gsap.set(slideEls, { zIndex: 1 });
  if (!clips[from]) return;
  gsap.set(clips[from], { clipPath: "inset(0% 0% 0% 0%)" });
  gsap.set(images[from], { scale: 1 });
  gsap.set(slideEls[from], { zIndex: 3 });
}

function settleMobileMediaTo(
  gsap: NonNullable<typeof window.gsap>,
  elements: SlideshowElements,
  to: number,
) {
  const { clips, images, slideEls } = elements;
  gsap.set(clips, { clipPath: "inset(100% 0% 0% 0%)" });
  gsap.set(images, { scale: 1.15, transformOrigin: "center center" });
  gsap.set(slideEls, { zIndex: 1 });
  if (!clips[to]) return;
  gsap.set(clips[to], { clipPath: "inset(0% 0% 0% 0%)" });
  gsap.set(images[to], { scale: 1 });
  gsap.set(slideEls[to], { zIndex: 3 });
}

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
  const scrollTriggerRef = useRef<{
    start: number;
    end: number;
    scroll: (position: number) => void;
  } | null>(null);
  const slideshowReadyRef = useRef(false);
  const pendingSlideRef = useRef<number | null>(null);
  const activeStepRef = useRef(0);
  const mobileTimelineRef = useRef<{ kill: () => void } | null>(null);
  const mobileAnimatingRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const syncMobileSlideClasses = useCallback((index: number) => {
    const root = wrapRef.current;
    if (!root) return;

    root.dataset.activeSlide = String(index);

    root.querySelectorAll<HTMLElement>(".servicio-slideshow__caption").forEach(
      (el, i) => {
        el.classList.toggle("is-active", i === index);
      },
    );
    root.querySelectorAll<HTMLElement>(".servicio-slideshow__media-slide").forEach(
      (el, i) => {
        el.classList.toggle("is-active", i === index);
      },
    );
    root
      .querySelectorAll<HTMLElement>(".servicio-slideshow__headline-line-item")
      .forEach((el) => {
        el.classList.toggle(
          "is-active",
          el.classList.contains(
            `servicio-slideshow__headline-line-item--${index}`,
          ),
        );
      });
  }, []);

  const setupMobileSlideshow = useCallback(
    async (initialIndex: number) => {
      const root = wrapRef.current;
      if (!root) return;

      try {
        const { gsap } = await loadGsap();
        if (!wrapRef.current) return;

        const elements = getSlideshowElements(root);
        setInitialSlideshowState(gsap, elements, initialIndex);
        syncCaptionStackHeight(root);
        syncHeadlineRowHeights(root);
        syncMobileSlideClasses(initialIndex);
        root
          .querySelector(".servicio-slideshow__headline")
          ?.classList.add("servicio-slideshow__headline--ready");
      } catch {
        syncMobileSlideClasses(initialIndex);
      }
    },
    [syncMobileSlideClasses],
  );

  const runMobileTransition = useCallback(
    async (from: number, to: number) => {
      const root = wrapRef.current;
      if (!root || from === to) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        syncMobileSlideClasses(to);
        try {
          const { gsap } = await loadGsap();
          const elements = getSlideshowElements(root);
          setInitialSlideshowState(gsap, elements, to);
        } catch {
          /* estado visual ya sincronizado con clases */
        }
        return;
      }

      mobileTimelineRef.current?.kill();

      try {
        const { gsap } = await loadGsap();
        if (!wrapRef.current) return;

        mobileAnimatingRef.current = true;
        const elements = getSlideshowElements(root);
        prepareMobileMediaFrom(gsap, elements, from);

        const tl = gsap.timeline({
          defaults: { ease: "power1.inOut" },
          onComplete: () => {
            mobileAnimatingRef.current = false;
            mobileTimelineRef.current = null;
            settleMobileMediaTo(gsap, elements, to);
            syncMobileSlideClasses(to);
            lockHeadlineSlide(
              gsap,
              elements.headlineLine1,
              elements.headlineLine2,
              to,
            );

            const pendingIndex = pendingSlideRef.current;
            if (pendingIndex !== null && pendingIndex !== to) {
              pendingSlideRef.current = null;
              const nextFrom = to;
              setActiveStepUi(pendingIndex);
              void runMobileTransition(nextFrom, pendingIndex);
            }
          },
        });

        mobileTimelineRef.current = tl;
        transitionSlideshowSlides(tl, from, to, elements, MOBILE_TRANS);
      } catch {
        mobileAnimatingRef.current = false;
        syncMobileSlideClasses(to);
      }
    },
    [syncMobileSlideClasses],
  );

  const scrollToSlideshowProgress = useCallback(
    (index: number, options?: { immediate?: boolean }) => {
      const slideCount = slides.length;
      if (slideCount === 0) return false;

      const progress = slideshowProgressForIndex(index, slideCount);

      const trigger =
        scrollTriggerRef.current ??
        (window.ScrollTrigger?.getById("servicio-slideshow") as
          | { start: number; end: number; scroll: (position: number) => void }
          | undefined);

      if (!trigger) return false;

      const scrollY =
        trigger.start + (trigger.end - trigger.start) * progress;
      const lenis = window.__mvLenis;
      const immediate = options?.immediate ?? true;

      const syncScroll = () => {
        window.ScrollTrigger?.update();
      };

      if (lenis) {
        lenis.start();
        lenis.scrollTo(scrollY, {
          immediate,
          duration: immediate ? 0 : 0.55,
          force: true,
          programmatic: true,
          onComplete: syncScroll,
        });
        syncScroll();
      } else {
        trigger.scroll(scrollY);
        syncScroll();
      }

      return true;
    },
    [slides.length],
  );

  const setActiveStepUi = useCallback((index: number) => {
    activeStepRef.current = index;
    setActiveStep(index);
    stepsRef.current
      ?.querySelectorAll<HTMLElement>(".servicio-slideshow__step")
      .forEach((step, i) => {
        const isActive = i === index;
        step.classList.toggle("is-active", isActive);
        step.setAttribute("aria-current", isActive ? "step" : "false");
      });
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      const wrap = wrapRef.current;
      if (!wrap || index < 0 || index >= slides.length) return;

      if (wrap.classList.contains("servicio-slideshow-wrap--mobile-all")) {
        if (index === activeStepRef.current) return;

        if (mobileAnimatingRef.current) {
          pendingSlideRef.current = index;
          setActiveStepUi(index);
          return;
        }

        const from = activeStepRef.current;
        setActiveStepUi(index);
        void runMobileTransition(from, index);
        return;
      }

      if (!slideshowReadyRef.current) {
        pendingSlideRef.current = index;
        return;
      }

      if (index === activeStepRef.current) return;

      if (!scrollToSlideshowProgress(index, { immediate: true })) {
        pendingSlideRef.current = index;
        return;
      }

      setActiveStepUi(index);
    },
    [runMobileTransition, scrollToSlideshowProgress, setActiveStepUi, slides.length],
  );

  useEffect(() => {
    const root = pinRef.current;
    if (!root) return;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      touchStartRef.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    };

    const onTouchEnd = (event: TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || event.changedTouches.length !== 1) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX < SWIPE_THRESHOLD_PX) return;
      if (absY > absX) return;
      if (absY > SWIPE_MAX_VERTICAL_PX && absY > absX * 0.85) return;

      const current = activeStepRef.current;
      if (deltaX < 0 && current < slides.length - 1) {
        goToSlide(current + 1);
        return;
      }
      if (deltaX > 0 && current > 0) {
        goToSlide(current - 1);
      }
    };

    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchend", onTouchEnd);
      touchStartRef.current = null;
    };
  }, [goToSlide, slides.length]);

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
      queueMicrotask(() => {
        setActiveStepUi(0);
        void setupMobileSlideshow(0);
      });
      return;
    }

    let killed = false;
    let timeline: { kill: () => void } | null = null;
    let didInit = false;

    const teardownDesktop = () => {
      killSlideshowScrollTrigger(true);
      timeline?.kill();
      timeline = null;
      scrollTriggerRef.current = null;
      slideshowReadyRef.current = false;
      didInit = false;

      const root = wrapRef.current;
      if (root) {
        clearSlideshowGsapStyles(root);
        clearSlideshowInlineStyles(root);
        root
          .querySelector(".servicio-slideshow__headline")
          ?.classList.remove("servicio-slideshow__headline--ready");
      }
    };

    const enableMobile = () => {
      teardownDesktop();
      wrap.classList.add("servicio-slideshow-wrap--mobile-all");
      setActiveStepUi(activeStepRef.current);
      void setupMobileSlideshow(activeStepRef.current);
    };

    const init = async () => {
      if (didInit) return;
      try {
        const { gsap, ScrollTrigger } = await loadGsap();
        if (killed || !wrapRef.current || !pinRef.current) return;

        killSlideshowScrollTrigger(true);
        timeline?.kill();

        bindLenisScrollTrigger(ScrollTrigger);

        const root = wrapRef.current;
        const pinEl = pinRef.current;
        const elements = getSlideshowElements(root);
        const {
          captions,
          headlineLine1,
          headlineLine2,
          clips,
          images,
          slideEls,
        } = elements;

        const slideCount = slides.length;

        setInitialSlideshowState(gsap, elements);
        syncCaptionStackHeight(root);

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
              setActiveStepUi(slideshowIndexFromProgress(self.progress, slideCount));
            },
          },
        });

        timeline = tl;
        const slideshowTrigger = ScrollTrigger.getById(
          "servicio-slideshow",
        ) as
          | {
              start: number;
              end: number;
              scroll: (position: number) => void;
            }
          | undefined;
        if (slideshowTrigger) {
          scrollTriggerRef.current = slideshowTrigger;
        }

        tl.to(images[0], { scale: 1, duration: SEG * 0.8 }, 0);

        const headlineEl = root.querySelector<HTMLElement>(
          ".servicio-slideshow__headline",
        );

        syncHeadlineRowHeights(root);

        const headlineSlideCount = headlineLine1.length;
        const desktopHeadlineYForSlide = (
          lineIndex: number,
          activeSlide: number,
        ) => headlineYForSlide(lineIndex, activeSlide, HEADLINE_OFF);

        /** Estados fijos en la timeline (scrub no usa gsap.set fuera del tl). */
        const lockDesktopHeadlineSlide = (activeSlide: number, at: number) => {
          for (let i = 0; i < headlineSlideCount; i += 1) {
            const y = desktopHeadlineYForSlide(i, activeSlide);
            const z = i === activeSlide ? 2 : 1;
            tl.set(
              [headlineLine1[i], headlineLine2[i]],
              { yPercent: y, zIndex: z, opacity: 1 },
              at,
            );
          }
        };

        const pushDesktopHeadlineSlide = (from: number, to: number, at: number) => {
          pushHeadlineSlide(
            tl,
            from,
            to,
            headlineLine1,
            headlineLine2,
            at,
            HEADLINE_TRANS,
            HEADLINE_EASE,
            HEADLINE_OFF,
          );
        };

        const transitionTo = (from: number, to: number, at: number) => {
          const windowStart = at - TRANS;
          tl.to(
            captions[from],
            { opacity: 0, duration: TRANS * 0.5, ease: "power1.inOut" },
            windowStart,
          );
          pushDesktopHeadlineSlide(from, to, at);
          lockDesktopHeadlineSlide(to, at);
          tl.set(slideEls[to], { zIndex: 4 }, windowStart);
          tl.fromTo(
            clips[to],
            { clipPath: "inset(100% 0% 0% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: TRANS,
              ease: "power2.inOut",
            },
            windowStart,
          );
          tl.fromTo(
            images[to],
            { scale: 1.15 },
            { scale: 1, duration: TRANS, ease: "power1.out" },
            windowStart,
          );
          tl.fromTo(
            captions[to],
            { opacity: 0 },
            { opacity: 1, duration: TRANS * 0.65, ease: "power1.out" },
            windowStart + TRANS * 0.15,
          );
        };

        lockDesktopHeadlineSlide(0, 0);

        for (let i = 0; i < slideCount - 1; i += 1) {
          transitionTo(i, i + 1, SEG * (i + 1));
        }

        setActiveStepUi(0);
        ScrollTrigger.refresh();
        headlineEl?.classList.add("servicio-slideshow__headline--ready");
        didInit = true;
        slideshowReadyRef.current = true;

        const pendingIndex = pendingSlideRef.current;
        if (pendingIndex !== null) {
          pendingSlideRef.current = null;
          scrollToSlideshowProgress(pendingIndex, { immediate: true });
        }
      } catch {
        wrap.classList.add("servicio-slideshow-wrap--mobile-all");
      }
    };

    const startTimer = window.setTimeout(() => {
      void init();
    }, 320);

    const onResize = () => {
      if (!desktopMq.matches) {
        enableMobile();
        return;
      }

      wrap.classList.remove("servicio-slideshow-wrap--mobile-all");
      clearSlideshowInlineStyles(wrap);
      void init();
    };
    desktopMq.addEventListener("change", onResize);

    return () => {
      killed = true;
      slideshowReadyRef.current = false;
      pendingSlideRef.current = null;
      mobileAnimatingRef.current = false;
      mobileTimelineRef.current?.kill();
      mobileTimelineRef.current = null;
      window.clearTimeout(startTimer);
      desktopMq.removeEventListener("change", onResize);
      teardownDesktop();
    };
  }, [
    runMobileTransition,
    scrollToSlideshowProgress,
    setActiveStepUi,
    setupMobileSlideshow,
    slides.length,
  ]);

  return (
    <div
      ref={wrapRef}
      id="servicio-slideshow"
      className="servicio-slideshow-wrap"
      aria-label="Galería del servicio"
    >
      <section ref={pinRef} className="servicio-slideshow">
        <div className="servicio-slideshow__layout">
          <div className="servicio-slideshow__dark">
            <div className="servicio-slideshow__caption-stack">
              {slides.map((slide, index) => (
                <p
                  key={`caption-${index}`}
                  className={
                    "servicio-slideshow__caption" +
                    ` servicio-slideshow__caption--${index}` +
                    (index === activeStep ? " is-active" : "")
                  }
                >
                  {slide.caption}
                </p>
              ))}
            </div>
            <nav
              ref={stepsRef}
              className="servicio-slideshow__steps"
              aria-label="Diapositivas"
              aria-live="polite"
            >
              {slides.map((slide, index) => (
                <button
                  key={`step-${index}`}
                  type="button"
                  className={
                    "servicio-slideshow__step" +
                    (index === activeStep ? " is-active" : "")
                  }
                  aria-current={index === activeStep ? "step" : undefined}
                  aria-label={`Ir a la diapositiva ${index + 1}: ${slide.headline1} ${slide.headline2}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    goToSlide(index);
                  }}
                >
                  <span className="servicio-slideshow__step-num">{index + 1}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="servicio-slideshow__media">
            <div className="servicio-slideshow__media-viewport">
              {slides.map((slide, index) => (
                <div
                  key={`media-${index}`}
                  data-servicio-slide={index}
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
