/**
 * Enlace Lenis ↔ ScrollTrigger.
 * `pinType: transform` evita el salto brusco típico de `fixed` con Lenis.
 */
export function bindLenisScrollTrigger(
  ScrollTrigger: NonNullable<typeof window.ScrollTrigger>,
) {
  const lenis = window.__mvLenis;
  if (!lenis || window.__mvScrollTriggerLenis) return;

  lenis.on("scroll", ScrollTrigger.update);

  const scroller = document.documentElement;
  ScrollTrigger.scrollerProxy(scroller, {
    scrollTop(value?: number) {
      if (value !== undefined) {
        lenis.scrollTo(value, { immediate: true });
      }
      return lenis.scroll;
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    },
    pinType: "transform",
  });

  window.__mvScrollTriggerLenis = true;
}

export function unbindLenisScrollTrigger() {
  const ScrollTrigger = window.ScrollTrigger;
  if (!ScrollTrigger || !window.__mvScrollTriggerLenis) return;

  ScrollTrigger.scrollerProxy(document.documentElement, {});
  delete window.__mvScrollTriggerLenis;
}
