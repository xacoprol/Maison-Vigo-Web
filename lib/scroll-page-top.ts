/** Scroll al inicio de página (nativo + Lenis) tras navegación SPA. */
export function scrollPageToTop() {
  if (typeof window === "undefined") return;

  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  const lenis = window.__mvLenis;
  if (!lenis) return;
  lenis.scrollTo(0, { immediate: true });
}

export function scrollPageToTopDeferred() {
  scrollPageToTop();
  requestAnimationFrame(() => {
    scrollPageToTop();
    window.__mvLenis?.resize();
    requestAnimationFrame(() => {
      scrollPageToTop();
      window.__mvLenis?.resize();
    });
  });
  window.setTimeout(() => {
    scrollPageToTop();
    window.__mvLenis?.resize();
  }, 80);
}
