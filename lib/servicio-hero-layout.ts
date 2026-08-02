/** Mide una sola vez la posición del texto editorial (no en cada scroll). */
export function layoutServicioHeroOnce() {
  const hero = document.querySelector<HTMLElement>(".servicio__hero");
  const leadWrap = document.querySelector<HTMLElement>(
    ".servicio__hero-lead-wrap",
  );
  const heroBody = document.querySelector<HTMLElement>(".servicio__hero-body");
  if (!hero || !leadWrap || !heroBody) return false;

  const styles = getComputedStyle(hero);
  const gap =
    Number.parseFloat(styles.getPropertyValue("--servicio-lead-body-gap")) ||
    350;
  const lift =
    Number.parseFloat(styles.getPropertyValue("--servicio-hero-lift")) || 0;

  /**
   * `offset*` ignora transforms (parallax). Así no salta `--servicio-body-top`
   * si iOS dispara resize al ocultar la barra o si el lead ya está desplazado.
   */
  let leadBottom = leadWrap.offsetTop + leadWrap.offsetHeight;
  const offsetParent = leadWrap.offsetParent;
  if (offsetParent instanceof HTMLElement && offsetParent !== hero) {
    leadBottom += offsetParent.offsetTop;
  }

  const topPx = Math.round(leadBottom + gap - lift);
  hero.style.setProperty("--servicio-body-top", `${topPx}px`);

  return true;
}
