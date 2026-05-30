/** Reinicia scroll nativo + Lenis al entrar en una ficha de servicio (SPA). */
export function resetServicioPageScroll() {
  if (typeof window === "undefined") return;

  window.scrollTo({ top: 0, left: 0, behavior: "instant" });

  const lenis = window.__mvLenis;
  if (!lenis) return;

  lenis.scrollTo(0, { immediate: true });
}

export function resetServicioPageScrollDeferred() {
  resetServicioPageScroll();
  requestAnimationFrame(() => {
    resetServicioPageScroll();
    window.__mvLenis?.resize();
    requestAnimationFrame(() => {
      resetServicioPageScroll();
      window.__mvLenis?.resize();
    });
  });
  window.setTimeout(() => {
    resetServicioPageScroll();
    window.__mvLenis?.resize();
  }, 80);
}
