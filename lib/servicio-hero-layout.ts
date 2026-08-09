/** Mide una sola vez la posición del texto editorial (no en cada scroll). */
export function layoutServicioHeroOnce() {
  const hero = document.querySelector<HTMLElement>(".servicio__hero");
  const leadWrap = document.querySelector<HTMLElement>(
    ".servicio__hero-lead-wrap",
  );
  const heroBody = document.querySelector<HTMLElement>(".servicio__hero-body");
  if (!hero || !leadWrap || !heroBody) return false;

  const styles = getComputedStyle(hero);
  const leadGap =
    Number.parseFloat(styles.getPropertyValue("--servicio-lead-body-gap")) ||
    350;
  const ctaGapRaw = Number.parseFloat(
    styles.getPropertyValue("--servicio-cta-body-gap"),
  );
  const lift =
    Number.parseFloat(styles.getPropertyValue("--servicio-hero-lift")) || 0;

  /**
   * Con CTA (acompañamiento), anclar bajo el botón — no bajo todo el wrap —
   * para no empujar el editorial demasiado lejos (el parallax lo dejaba “justo”).
   * Sin CTA, anclar al subtítulo (`.servicio__hero-lead`) como antes.
   */
  const cta = hero.querySelector<HTMLElement>(".servicio__hero-cta-wrap");
  const lead = hero.querySelector<HTMLElement>(".servicio__hero-lead");
  const anchor = cta ?? lead ?? leadWrap;
  const gap =
    cta && Number.isFinite(ctaGapRaw)
      ? ctaGapRaw
      : cta
        ? Math.round(leadGap * 0.4)
        : leadGap;

  /**
   * `offset*` ignora transforms (parallax). Así no salta `--servicio-body-top`
   * si iOS dispara resize al ocultar la barra o si el lead ya está desplazado.
   */
  let anchorBottom = anchor.offsetTop + anchor.offsetHeight;
  let node: HTMLElement | null = anchor;
  while (node && node !== hero) {
    const parent: Element | null = node.offsetParent;
    if (!(parent instanceof HTMLElement) || parent === hero) break;
    anchorBottom += parent.offsetTop;
    node = parent;
  }

  const topPx = Math.round(anchorBottom + gap - lift);
  hero.style.setProperty("--servicio-body-top", `${topPx}px`);

  return true;
}
