"use client";

import { useEffect } from "react";

/**
 * Parallax y reveal del título para `#concepto` (home y /mvcare).
 * Escucha `mv-scroll` emitido por SiteEffects.
 */
export function ConceptoEffects() {
  useEffect(() => {
    const conceptoSection = document.getElementById("concepto");
    if (!conceptoSection) return;

    const conceptoTitle = document.querySelector<HTMLElement>(
      ".concepto-title-display",
    );
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let conceptoTitleRevealed = false;

    const runScrollEffects = () => {
      const ih = window.innerHeight;
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

      const serviciosSection = document.getElementById("servicios");
      const serviciosRect = serviciosSection?.getBoundingClientRect();
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

      if (prefersReducedMotion && conceptoTitle) {
        conceptoTitle.classList.add("is-revealed");
        conceptoTitleRevealed = true;
      }

    };

    const onMvScroll = () => {
      runScrollEffects();
    };

    if (prefersReducedMotion) {
      conceptoTitle?.classList.add("is-revealed");
      conceptoTitleRevealed = true;
    }

    window.addEventListener("mv-scroll", onMvScroll);
    runScrollEffects();

    return () => {
      window.removeEventListener("mv-scroll", onMvScroll);
      conceptoSection.style.setProperty("--concepto-parallax-progress", "0");
      conceptoSection.style.setProperty("--concepto-bg-parallax-progress", "0");
      conceptoSection.style.setProperty("--concepto-exit-darken", "0");
    };
  }, []);

  return null;
}
