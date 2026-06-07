"use client";

import { useEffect } from "react";

import { isMobileSiteNav } from "@/lib/nav-mobile";

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

      if (isMobileSiteNav()) {
        navbar.classList.remove("nav-hidden");
        lastScrollY = scrollY;
        return;
      }

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
      observer?.disconnect();
      revealNodes.forEach((el) => el.classList.remove("is-visible"));
      titleDisplays.forEach((el) => el.classList.remove("is-revealed"));
      navbar?.classList.remove("nav-hidden");
    };
  }, []);

  return null;
}
