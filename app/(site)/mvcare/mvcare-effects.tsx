"use client";

import { useEffect } from "react";

/** Reveal suave de bloques al entrar en viewport (escucha `mv-scroll`). */
export function MvcareEffects() {
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(".mvcare-reveal"),
    );
    if (!nodes.length) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      nodes.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const visible = new WeakSet<HTMLElement>();

    const update = () => {
      const vh = window.innerHeight;
      nodes.forEach((el) => {
        if (visible.has(el)) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < vh * 0.88 && rect.bottom > vh * 0.06) {
          el.classList.add("is-visible");
          visible.add(el);
        }
      });
    };

    window.addEventListener("mv-scroll", update);
    window.addEventListener("resize", update, { passive: true });
    update();

    return () => {
      window.removeEventListener("mv-scroll", update);
      window.removeEventListener("resize", update);
      nodes.forEach((el) => el.classList.remove("is-visible"));
    };
  }, []);

  return null;
}
