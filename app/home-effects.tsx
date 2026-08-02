"use client";

import { useEffect } from "react";

import { lockScroll, unlockScroll } from "@/lib/scroll-lock";
/**
 * Efectos exclusivos de la home: animación de intro (logoIntro → wordmark nav)
 * y parallaxes / reveals de hero, concepto y servicios. La UI persistente
 * (Lenis, hamburguesa, cookies, reserva) vive en `<SiteEffects />`.
 *
 * Se sincroniza con Lenis a través del evento `mv-scroll` emitido por
 * SiteEffects; si no hay smooth scroll, cae a `scroll` nativo.
 */
export function HomeEffects() {
  useEffect(() => {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;
    const heroSection = document.getElementById("hero");
    const conceptoSection = document.getElementById("concepto");
    const serviciosSection = document.getElementById("servicios");
    const serviciosCarouselEl = serviciosSection?.querySelector<HTMLElement>(
      ".servicios-carousel",
    );
    const conceptoTitle = document.querySelector<HTMLElement>(
      ".concepto-title-display",
    );
    const serviciosHeadingDisplay = document.querySelector<HTMLElement>(
      ".servicios-heading-display",
    );
    const body = document.body;
    const introEl = document.getElementById("logoIntro");
    const introLogoFlightMs = 3500;
    const introCompleteFallbackMs = introLogoFlightMs + 2600;
    const introFlightEndScaleFallback = 0.33;
    const introSeenCookie = "mv_intro_seen";
    const introSeenMaxAgeSec = 60 * 60 * 24;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const unionBounds = (rects: DOMRect[]) => {
      if (!rects.length) return null;
      return rects.reduce(
        (acc, rect) => ({
          left: Math.min(acc.left, rect.left),
          top: Math.min(acc.top, rect.top),
          right: Math.max(acc.right, rect.right),
          bottom: Math.max(acc.bottom, rect.bottom),
        }),
        {
          left: rects[0].left,
          top: rects[0].top,
          right: rects[0].right,
          bottom: rects[0].bottom,
        },
      );
    };

    const setIntroTarget = () => {
      if (!introEl) return;
      if (introEl.classList.contains("logo-intro--fly")) return;
      const introPieces = Array.from(
        introEl.querySelectorAll<HTMLElement>(".logo-intro-piece"),
      );
      if (!introPieces.length) return;

      const introRects = introPieces.map((piece) =>
        piece.getBoundingClientRect(),
      );
      const introUnion = unionBounds(introRects);
      if (!introUnion) return;

      const introWordmark = introEl.querySelector<HTMLElement>(
        ".logo-intro-piece--two",
      );
      const navWordmark = navbar.querySelector<HTMLElement>(
        ".nav-brand-piece--two",
      );
      const tw = introWordmark?.getBoundingClientRect();
      const nw = navWordmark?.getBoundingClientRect();

      let alignIntroCx =
        introUnion.left + (introUnion.right - introUnion.left) / 2;
      let alignIntroCy =
        introUnion.top + (introUnion.bottom - introUnion.top) / 2;
      if (tw && tw.width > 0) {
        alignIntroCx = tw.left + tw.width / 2;
        alignIntroCy = tw.top + tw.height / 2;
      }

      let alignNavCx: number;
      let alignNavCy: number;
      let targetScale = introFlightEndScaleFallback;

      if (tw && tw.width > 0 && nw && nw.width > 0) {
        targetScale = nw.width / tw.width;
        alignNavCx = nw.left + nw.width / 2;
        alignNavCy = nw.top + nw.height / 2;
      } else {
        const brandSlot =
          navbar.querySelector<HTMLElement>("a.nav-brand") ?? navbar;
        const slot = brandSlot.getBoundingClientRect();
        if (slot.width <= 0 || slot.height <= 0) return;
        alignNavCx = slot.left + slot.width / 2;
        alignNavCy = slot.top + slot.height / 2;
      }

      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = window.innerHeight / 2;
      const targetX =
        alignNavCx -
        viewportCenterX -
        (alignIntroCx - viewportCenterX) * targetScale;
      const targetY =
        alignNavCy -
        viewportCenterY -
        (alignIntroCy - viewportCenterY) * targetScale;
      introEl.style.setProperty("--logo-intro-target-x", `${targetX}px`);
      introEl.style.setProperty("--logo-intro-target-y", `${targetY}px`);
      introEl.style.setProperty("--logo-intro-target-scale", `${targetScale}`);
    };

    let introCompleteFallbackTimer: number | undefined;
    let flightTimer: number | undefined;
    let onResizeIntro: (() => void) | undefined;
    let introFinished = false;
    let introStarted = false;
    let conceptoTitleRevealed = false;
    let serviciosTitleRevealed = false;
    const serviciosCarouselReveal = document.querySelector<HTMLElement>(
      ".servicios-carousel-wrap.reveal",
    );
    const espacioDesktopSection = document.querySelector<HTMLElement>(
      ".espacio[data-espacio]",
    );
    let serviciosParallaxTarget = 0;
    let lastScrollY = window.scrollY;

    const hasSeenIntroRecently = () =>
      document.cookie
        .split(";")
        .map((part) => part.trim())
        .some((part) => part === `${introSeenCookie}=1`);

    const setIntroSeenCookie = () => {
      document.cookie = `${introSeenCookie}=1; Max-Age=${introSeenMaxAgeSec}; Path=/; SameSite=Lax`;
    };

    const finishIntro = () => {
      if (introFinished || !introEl) return;
      introFinished = true;
      if (introCompleteFallbackTimer) {
        window.clearTimeout(introCompleteFallbackTimer);
      }
      introEl.removeEventListener("animationend", onIntroFlyEnd);
      /**
       * `intro-complete` antes que quitar `intro-active`: si no, deja de
       * aplicarse `logoIntroMove` y el transform del overlay vuelve a
       * identidad un instante antes de `display:none` → flash/salto al
       * mostrar el nav.
       */
      body.classList.add("intro-complete");
      body.classList.remove("intro-active");
      body.classList.remove("intro-logo-flight");
      unlockScroll();
      document.body.dispatchEvent(new Event("mv-intro-complete"));
      if (introStarted) setIntroSeenCookie();
    };

    const onIntroFlyEnd = (e: AnimationEvent) => {
      if (e.animationName !== "logoIntroMove") return;
      requestAnimationFrame(() => requestAnimationFrame(finishIntro));
    };

    const skipIntro = prefersReducedMotion || hasSeenIntroRecently();
    if (skipIntro) {
      body.classList.add("intro-complete");
    } else if (introEl) {
      introStarted = true;
      body.classList.add("intro-active");
      lockScroll();
      requestAnimationFrame(() => {
        introEl.classList.add("is-playing");
      });
      flightTimer = window.setTimeout(() => {
        requestAnimationFrame(() => {
          setIntroTarget();
          introEl.addEventListener("animationend", onIntroFlyEnd);
          introEl.classList.add("logo-intro--fly");
          body.classList.add("intro-logo-flight");
        });
      }, introLogoFlightMs);
      introCompleteFallbackTimer = window.setTimeout(
        finishIntro,
        introCompleteFallbackMs,
      );
      onResizeIntro = () => {
        if (!introEl || introEl.classList.contains("logo-intro--fly")) return;
        setIntroTarget();
      };
      window.addEventListener("resize", onResizeIntro);
    } else {
      body.classList.add("intro-complete");
    }

    /** Progreso 0→1 mientras el carrusel cruza el viewport (scroll ↓ sube, ↑ baja). */
    const updateServiciosParallaxTarget = () => {
      if (!serviciosSection || prefersReducedMotion) {
        serviciosParallaxTarget = 0;
        serviciosSection?.style.setProperty("--servicios-parallax", "0");
        return;
      }

      /**
       * Desktop: mientras El espacio sigue visible (scroll horizontal por
       * scroll vertical), no activar parallax de servicios — evita choque al
       * pasar de una sección a otra.
       */
      if (
        espacioDesktopSection &&
        !window.matchMedia("(max-width: 900px)").matches
      ) {
        const espacioRect = espacioDesktopSection.getBoundingClientRect();
        if (espacioRect.bottom > 0) {
          serviciosParallaxTarget = 0;
          serviciosSection.style.setProperty("--servicios-parallax", "0");
          return;
        }
      }

      const ih = window.innerHeight;
      const anchor = serviciosCarouselEl ?? serviciosSection;
      const sr = anchor.getBoundingClientRect();
      if (sr.bottom <= 0) {
        serviciosParallaxTarget = sr.top < 0 ? 1 : 0;
      } else if (sr.top >= ih) {
        serviciosParallaxTarget = 0;
      } else {
        const focusY = sr.top + sr.height * 0.38;
        const rangeStart = ih * 0.96;
        const rangeEnd = ih * 0.28;
        serviciosParallaxTarget =
          (rangeStart - focusY) / Math.max(rangeStart - rangeEnd, 1);
        serviciosParallaxTarget = Math.min(
          Math.max(serviciosParallaxTarget, 0),
          1,
        );
      }
      serviciosSection.style.setProperty(
        "--servicios-parallax",
        serviciosParallaxTarget.toFixed(3),
      );
    };

    const runScrollEffects = (scrollY?: number) => {
      const currentScrollY =
        typeof scrollY === "number" ? scrollY : window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;
      const isScrollingDown = scrollDelta > 2;
      const isScrollingUp = scrollDelta < -2;
      const ih = window.innerHeight;
      if (heroSection) {
        const maxScroll = Math.max(heroSection.clientHeight * 0.78, 1);
        const progress = Math.min(Math.max(currentScrollY / maxScroll, 0), 1);
        heroSection.style.setProperty(
          "--hero-scroll-progress",
          progress.toFixed(3),
        );
        const heroPassed = currentScrollY > heroSection.offsetHeight - 20;
        if (heroPassed && isScrollingDown) {
          navbar.classList.add("nav-hidden");
        } else if (!heroPassed || isScrollingUp || currentScrollY < 10) {
          navbar.classList.remove("nav-hidden");
        }
      }
      /**
       * Cachear el rect de servicios: lo usaban `concepto-exit-darken` y
       * `updateServiciosParallaxTarget`, antes haciendo 2 lecturas por frame.
       */
      const serviciosRect = serviciosSection?.getBoundingClientRect();
      if (conceptoSection) {
        const rect = conceptoSection.getBoundingClientRect();
        const parallaxStartY = ih * 0.68;
        const centerDelta = parallaxStartY - (rect.top + rect.height * 0.5);
        const denom = ih * 0.55;
        const raw = centerDelta / denom;
        const conceptProgress = Math.min(Math.max(raw, -1.15), 2.75);
        const conceptBgProgress = Math.min(Math.abs(conceptProgress), 1.22);
        conceptoSection.style.setProperty(
          "--concepto-parallax-progress",
          conceptProgress.toFixed(3),
        );
        conceptoSection.style.setProperty(
          "--concepto-bg-parallax-progress",
          conceptBgProgress.toFixed(3),
        );
        if (!conceptoTitleRevealed && rect.top < ih * 0.58) {
          conceptoTitle?.classList.add("is-revealed");
          conceptoTitleRevealed = true;
        }
        if (serviciosRect) {
          const exitDarken =
            serviciosRect.top < ih
              ? Math.min(Math.max((ih - serviciosRect.top) / ih, 0), 1)
              : 0;
          conceptoSection.style.setProperty(
            "--concepto-exit-darken",
            exitDarken.toFixed(3),
          );
        } else {
          conceptoSection.style.setProperty("--concepto-exit-darken", "0");
        }
      }
      updateServiciosParallaxTarget();
      if (!serviciosTitleRevealed && serviciosHeadingDisplay) {
        const hr = serviciosHeadingDisplay.getBoundingClientRect();
        if (hr.top < ih * 0.58) {
          serviciosHeadingDisplay.classList.add("is-revealed");
          serviciosTitleRevealed = true;
          serviciosCarouselReveal?.classList.add("visible");
        }
      }
      if (
        serviciosCarouselReveal &&
        !serviciosCarouselReveal.classList.contains("visible") &&
        serviciosRect &&
        serviciosRect.top < ih * 0.9 &&
        serviciosRect.bottom > ih * 0.08
      ) {
        serviciosCarouselReveal.classList.add("visible");
      }
      lastScrollY = currentScrollY;
    };

    const onMvScroll = (event: Event) => {
      const y = (event as CustomEvent<{ y: number }>).detail?.y;
      runScrollEffects(typeof y === "number" ? y : undefined);
    };

    /**
     * `mv-scroll` lo emite SiteEffects para CADA evento de scroll (con o sin
     * Lenis), así que ya no hace falta suscribirse también a `scroll` nativo:
     * doblaba el trabajo en cada wheel-tick.
     */
    window.addEventListener("mv-scroll", onMvScroll);
    runScrollEffects(window.scrollY);

    return () => {
      if (introCompleteFallbackTimer) {
        window.clearTimeout(introCompleteFallbackTimer);
      }
      if (flightTimer) {
        window.clearTimeout(flightTimer);
      }
      if (introEl) {
        introEl.removeEventListener("animationend", onIntroFlyEnd);
        introEl.classList.remove("is-playing");
        introEl.classList.remove("logo-intro--fly");
      }
      if (onResizeIntro) {
        window.removeEventListener("resize", onResizeIntro);
      }
      window.removeEventListener("mv-scroll", onMvScroll);
      navbar.classList.remove("nav-hidden");
      if (heroSection) {
        heroSection.style.setProperty("--hero-scroll-progress", "0");
      }
      if (conceptoSection) {
        conceptoSection.style.setProperty("--concepto-parallax-progress", "0");
        conceptoSection.style.setProperty(
          "--concepto-bg-parallax-progress",
          "0",
        );
        conceptoSection.style.setProperty("--concepto-exit-darken", "0");
      }
      serviciosSection?.style.removeProperty("--servicios-parallax");
      body.classList.remove("intro-active");
      body.classList.remove("intro-logo-flight");
    };
  }, []);

  return null;
}
