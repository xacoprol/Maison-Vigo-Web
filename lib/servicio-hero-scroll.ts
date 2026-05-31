/** Opacidad al aterrizar (sin scroll). */
export const SERVICIO_BODY_OPACITY_MIN = 0;
/** Tras empezar a bajar (antes de llegar al 100 %). */
export const SERVICIO_BODY_OPACITY_FLOOR = 0.5;
export const SERVICIO_BODY_OPACITY_MAX = 1;

/** Píxeles mínimos de scroll antes del fade (evita flash al cargar). */
export const SERVICIO_BODY_SCROLL_THRESHOLD_PX = 4;

/** Progreso de scroll del hero en el que la opacidad ya es 100 %. */
export const SERVICIO_BODY_OPACITY_FULL_AT = 0.62;

/**
 * Progreso 0–1 del scroll dentro del hero (solo cuando el hero sube al hacer scroll).
 */
export function getServicioHeroScrollProgress(hero: HTMLElement): number {
  const vh = window.innerHeight;
  const heroH = hero.offsetHeight;
  if (heroH < 48) return 0;

  const scrolled = Math.max(0, -hero.getBoundingClientRect().top);
  if (scrolled < SERVICIO_BODY_SCROLL_THRESHOLD_PX) return 0;

  const travel = Math.max(heroH - vh * 0.14, vh * 0.28);
  if (travel <= 0) return 0;

  const effective = scrolled - SERVICIO_BODY_SCROLL_THRESHOLD_PX;
  const effectiveTravel = travel - SERVICIO_BODY_SCROLL_THRESHOLD_PX;
  if (effectiveTravel <= 0) return 0;

  return Math.min(1, effective / effectiveTravel);
}

function smoothstep01(u: number) {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
}

/**
 * 0 % al aterrizar; al bajar sube suave hasta 50 %; luego 50 % → 100 % en el hero.
 */
export function servicioBodyOpacityFromProgress(progress: number): number {
  const raw = Math.min(1, Math.max(0, progress));
  if (raw <= 0) return SERVICIO_BODY_OPACITY_MIN;

  const t = Math.min(1, raw / SERVICIO_BODY_OPACITY_FULL_AT);

  const toFloorEnd = 0.1;
  if (t < toFloorEnd) {
    return SERVICIO_BODY_OPACITY_FLOOR * smoothstep01(t / toFloorEnd);
  }

  const u = (t - toFloorEnd) / (1 - toFloorEnd);
  return (
    SERVICIO_BODY_OPACITY_FLOOR +
    smoothstep01(u) * (SERVICIO_BODY_OPACITY_MAX - SERVICIO_BODY_OPACITY_FLOOR)
  );
}

/** Solo scroll del hero. */
export function getServicioBodyScrollRevealProgress(
  _textEl: HTMLElement,
  hero: HTMLElement,
): number {
  const scrolled = Math.max(0, -hero.getBoundingClientRect().top);
  if (scrolled < SERVICIO_BODY_SCROLL_THRESHOLD_PX) return 0;
  return getServicioHeroScrollProgress(hero);
}
