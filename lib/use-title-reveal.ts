"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Ellipse title reveal (misma curva que home / concepto / MV Care).
 * Añade `is-revealed` al entrar en viewport.
 */
export function useTitleReveal<T extends HTMLElement = HTMLHeadingElement>() {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setRevealed(true);
        obs.disconnect();
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return {
    ref,
    revealed,
    displayClassName: "mv-title-display" + (revealed ? " is-revealed" : ""),
  };
}
