"use client";

import { useEffect } from "react";

export function HomeEffects() {
  useEffect(() => {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;
    const heroSection = document.getElementById("hero");
    const body = document.body;
    const introEl = document.getElementById("logoIntro");
    /** Piezas terminan ~3.5s → vuelo inmediato */
    const introLogoFlightMs = 3500;
    /** Si no llega animationend (raro), cerrar intro igualmente */
    const introCompleteFallbackMs = introLogoFlightMs + 2600;
    /** Solo si falla la medición del wordmark del nav antes del vuelo */
    const introFlightEndScaleFallback = 0.33;

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

      const introRects = introPieces.map((piece) => piece.getBoundingClientRect());
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

      let alignIntroCx = introUnion.left + (introUnion.right - introUnion.left) / 2;
      let alignIntroCy = introUnion.top + (introUnion.bottom - introUnion.top) / 2;
      if (tw && tw.width > 0) {
        alignIntroCx = tw.left + tw.width / 2;
        alignIntroCy = tw.top + tw.height / 2;
      }

      let alignNavCx: number;
      let alignNavCy: number;
      let targetScale = introFlightEndScaleFallback;

      if (tw && tw.width > 0 && nw && nw.width > 0) {
        /** Misma anchura visual que el wordmark del header: no “crece” al cambiar al nav */
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
        alignNavCx - viewportCenterX - (alignIntroCx - viewportCenterX) * targetScale;
      const targetY =
        alignNavCy - viewportCenterY - (alignIntroCy - viewportCenterY) * targetScale;
      introEl.style.setProperty("--logo-intro-target-x", `${targetX}px`);
      introEl.style.setProperty("--logo-intro-target-y", `${targetY}px`);
      introEl.style.setProperty("--logo-intro-target-scale", `${targetScale}`);
    };

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let introCompleteFallbackTimer: number | undefined;
    let flightTimer: number | undefined;
    let onResizeIntro: (() => void) | undefined;
    let introFinished = false;

    const lockScroll = () => {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    };

    const unlockScroll = () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };

    const finishIntro = () => {
      if (introFinished || !introEl) return;
      introFinished = true;
      if (introCompleteFallbackTimer) {
        window.clearTimeout(introCompleteFallbackTimer);
      }
      introEl.removeEventListener("animationend", onIntroFlyEnd);
      /**
       * `intro-complete` antes que quitar `intro-active`: si no, deja de aplicarse
       * `logoIntroMove` y el transform del overlay vuelve a identidad un instante
       * antes de `display:none` → flash/salto al mostrar el nav.
       */
      body.classList.add("intro-complete");
      body.classList.remove("intro-active");
      body.classList.remove("intro-logo-flight");
      unlockScroll();
    };

    const onIntroFlyEnd = (e: AnimationEvent) => {
      if (e.animationName !== "logoIntroMove") return;
      requestAnimationFrame(() => {
        requestAnimationFrame(finishIntro);
      });
    };

    if (prefersReducedMotion) {
      body.classList.add("intro-complete");
    } else if (introEl) {
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

    const onScroll = () => {
      navbar.classList.toggle("scrolled", window.scrollY > 40);
      if (heroSection) {
        const maxScroll = Math.max(heroSection.clientHeight * 0.78, 1);
        const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
        heroSection.style.setProperty("--hero-scroll-progress", progress.toFixed(3));
      }
    };
    window.addEventListener("scroll", onScroll);
    onScroll();

    const hamburger = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobileMenu");
    const closeMenuEl = document.getElementById("closeMenu");
    const mobLinks = document.querySelectorAll<HTMLElement>(".mob-link");

    const openMenu = () => mobileMenu?.classList.add("open");
    const closeMenuFn = () => mobileMenu?.classList.remove("open");

    hamburger?.addEventListener("click", openMenu);
    closeMenuEl?.addEventListener("click", closeMenuFn);
    mobLinks.forEach((l) => l.addEventListener("click", closeMenuFn));

    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    reveals.forEach((r) => observer.observe(r));

    return () => {
      if (introCompleteFallbackTimer) {
        window.clearTimeout(introCompleteFallbackTimer);
      }
      if (flightTimer) {
        window.clearTimeout(flightTimer);
      }
      if (introEl) {
        introEl.removeEventListener("animationend", onIntroFlyEnd);
      }
      unlockScroll();
      body.classList.remove("intro-active");
      body.classList.remove("intro-logo-flight");
      if (introEl) {
        introEl.classList.remove("is-playing");
        introEl.classList.remove("logo-intro--fly");
      }
      if (onResizeIntro) {
        window.removeEventListener("resize", onResizeIntro);
      }
      window.removeEventListener("scroll", onScroll);
      if (heroSection) {
        heroSection.style.setProperty("--hero-scroll-progress", "0");
      }
      hamburger?.removeEventListener("click", openMenu);
      closeMenuEl?.removeEventListener("click", closeMenuFn);
      mobLinks.forEach((l) => l.removeEventListener("click", closeMenuFn));
      observer.disconnect();
    };
  }, []);

  return null;
}
