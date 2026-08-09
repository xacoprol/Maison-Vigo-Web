"use client";

import { useEffect } from "react";

/** Reveal suave de bloques, títulos y nav al salir del hero (como home). */
export function MvcareEffects() {
  useEffect(() => {
    const navbar = document.getElementById("navbar");
    const hero = document.querySelector<HTMLElement>(".mvcare-hero");
    const revealNodes = Array.from(
      document.querySelectorAll<HTMLElement>(".mvcare-reveal"),
    );
    const titleDisplays = Array.from(
      document.querySelectorAll<HTMLElement>(".mvcare-title-display"),
    );

    const getScrollY = () => window.__mvLenis?.scroll ?? window.scrollY;
    let lastScrollY = getScrollY();

    const updateNavVisibility = (scrollY: number) => {
      if (!navbar || !hero) return;

      const scrollDelta = scrollY - lastScrollY;
      const isScrollingDown = scrollDelta > 2;
      const isScrollingUp = scrollDelta < -2;
      const heroPassed = scrollY > hero.offsetHeight - 20;

      if (heroPassed && isScrollingDown) {
        navbar.classList.add("nav-hidden");
      } else if (!heroPassed || isScrollingUp || scrollY < 10) {
        navbar.classList.remove("nav-hidden");
      }

      lastScrollY = scrollY;
    };

    const onMvScroll = (event: Event) => {
      const y = (event as CustomEvent<{ y: number }>).detail?.y;
      updateNavVisibility(typeof y === "number" ? y : getScrollY());
    };

    updateNavVisibility(getScrollY());
    window.addEventListener("mv-scroll", onMvScroll);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const startSection = document.getElementById("mvcare-empezar");
    let startParallaxRaf = 0;
    let startParallaxTarget = 0;
    let startParallaxCurrent = 0;

    const updateStartBgParallaxTarget = () => {
      if (!startSection || prefersReducedMotion) return;
      const rect = startSection.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = rect.top + rect.height * 0.5;
      const raw = (vh * 0.5 - center) / (vh + rect.height * 0.5);
      startParallaxTarget = Math.min(1, Math.max(-1, raw * 1.35));
    };

    const tickStartBgParallax = () => {
      if (!startSection) {
        startParallaxRaf = 0;
        return;
      }
      const diff = startParallaxTarget - startParallaxCurrent;
      if (Math.abs(diff) < 0.001) {
        startParallaxCurrent = startParallaxTarget;
      } else {
        startParallaxCurrent += diff * 0.12;
      }
      startSection.style.setProperty(
        "--mvcare-start-bg-parallax",
        startParallaxCurrent.toFixed(3),
      );
      if (Math.abs(startParallaxTarget - startParallaxCurrent) > 0.001) {
        startParallaxRaf = window.requestAnimationFrame(tickStartBgParallax);
      } else {
        startParallaxRaf = 0;
      }
    };

    const scheduleStartBgParallax = () => {
      if (!startSection || prefersReducedMotion) return;
      updateStartBgParallaxTarget();
      if (!startParallaxRaf) {
        startParallaxRaf = window.requestAnimationFrame(tickStartBgParallax);
      }
    };

    if (startSection) {
      if (prefersReducedMotion) {
        startSection.style.setProperty("--mvcare-start-bg-parallax", "0");
      } else {
        scheduleStartBgParallax();
        window.addEventListener("mv-scroll", scheduleStartBgParallax);
        window.addEventListener("resize", scheduleStartBgParallax);
      }
    }

    let observer: IntersectionObserver | undefined;

    if (revealNodes.length || titleDisplays.length) {
      if (prefersReducedMotion) {
        revealNodes.forEach((el) => el.classList.add("is-visible"));
        titleDisplays.forEach((el) => el.classList.add("is-revealed"));
      } else {
        const visible = new WeakSet<HTMLElement>();
        const revealedTitles = new WeakSet<HTMLElement>();

        const markVisible = (el: HTMLElement) => {
          if (visible.has(el)) return;
          el.classList.add("is-visible");
          visible.add(el);
        };

        const markTitleRevealed = (el: HTMLElement) => {
          if (revealedTitles.has(el)) return;
          el.classList.add("is-revealed");
          revealedTitles.add(el);
        };

        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const el = entry.target as HTMLElement;
              if (el.classList.contains("mvcare-title-display")) {
                markTitleRevealed(el);
              } else {
                markVisible(el);
              }
              observer?.unobserve(el);
            });
          },
          { threshold: 0.06, rootMargin: "0px 0px -6% 0px" },
        );

        revealNodes.forEach((el) => observer?.observe(el));
        titleDisplays.forEach((el) => observer?.observe(el));
      }
    }

    return () => {
      window.removeEventListener("mv-scroll", onMvScroll);
      window.removeEventListener("mv-scroll", scheduleStartBgParallax);
      window.removeEventListener("resize", scheduleStartBgParallax);
      if (startParallaxRaf) window.cancelAnimationFrame(startParallaxRaf);
      startSection?.style.removeProperty("--mvcare-start-bg-parallax");
      observer?.disconnect();
      revealNodes.forEach((el) => el.classList.remove("is-visible"));
      titleDisplays.forEach((el) => el.classList.remove("is-revealed"));
      navbar?.classList.remove("nav-hidden");
    };
  }, []);

  return null;
}
