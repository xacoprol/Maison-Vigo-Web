"use client";

import { useEffect } from "react";

/** Reveal suave de bloques y títulos al entrar en viewport. */
export function MvcareEffects() {
  useEffect(() => {
    const revealNodes = Array.from(
      document.querySelectorAll<HTMLElement>(".mvcare-reveal"),
    );
    const titleDisplays = Array.from(
      document.querySelectorAll<HTMLElement>(".mvcare-title-display"),
    );

    if (!revealNodes.length && !titleDisplays.length) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      revealNodes.forEach((el) => el.classList.add("is-visible"));
      titleDisplays.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          if (el.classList.contains("mvcare-title-display")) {
            markTitleRevealed(el);
          } else {
            markVisible(el);
          }
          observer.unobserve(el);
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -6% 0px" },
    );

    revealNodes.forEach((el) => observer.observe(el));
    titleDisplays.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      revealNodes.forEach((el) => el.classList.remove("is-visible"));
      titleDisplays.forEach((el) => el.classList.remove("is-revealed"));
    };
  }, []);

  return null;
}
