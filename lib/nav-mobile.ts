/** Nav/menú móvil compartido (≤900px). */
export const MOBILE_SITE_NAV_MQ = "(max-width: 900px)";

export function isMobileSiteNav(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_SITE_NAV_MQ).matches;
}
