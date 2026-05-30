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

  const heroRect = hero.getBoundingClientRect();
  const leadRect = leadWrap.getBoundingClientRect();
  const topPx = Math.round(leadRect.bottom - heroRect.top + gap);
  hero.style.setProperty("--servicio-body-top", `${topPx}px`);

  return true;
}
