import { layoutServicioHeroOnce } from "@/lib/servicio-hero-layout";

const lenisEase = (t: number) => 1 - Math.pow(1 - t, 3);

/** Margen superior al mostrar el texto editorial (respeta el nav). */
function servicioBodyViewportOffset() {
  return Math.min(168, Math.max(104, window.innerHeight * 0.14));
}

/** Scroll Y para alinear `#servicio-body` bajo el nav. */
export function getServicioBodyScrollY(): number | null {
  layoutServicioHeroOnce();

  const body =
    document.getElementById("servicio-body") ??
    document.querySelector<HTMLElement>(".servicio__hero-body");
  if (!body) return null;

  const scrollY = window.__mvLenis?.scroll ?? window.scrollY;
  const bodyTop = body.getBoundingClientRect().top + scrollY;

  return Math.max(0, Math.round(bodyTop - servicioBodyViewportOffset()));
}

/** Hero (título/lead) → texto editorial del propio servicio. */
export function scrollToServicioHeroBody(options?: { immediate?: boolean }) {
  const body =
    document.getElementById("servicio-body") ??
    document.querySelector<HTMLElement>(".servicio__hero-body");
  const targetY = getServicioBodyScrollY();
  if (!body || targetY === null) return false;

  const immediate = options?.immediate ?? false;
  const lenis = window.__mvLenis;
  const viewOffset = servicioBodyViewportOffset();

  const notifyScroll = () => {
    window.ScrollTrigger?.update();
    window.dispatchEvent(
      new CustomEvent("mv-scroll", {
        detail: { y: lenis?.scroll ?? window.scrollY },
      }),
    );
  };

  if (lenis) {
    lenis.scrollTo(body, {
      offset: -viewOffset,
      duration: immediate ? 0 : 1.25,
      immediate,
      easing: lenisEase,
      force: true,
      programmatic: true,
      onComplete: notifyScroll,
    });
    return true;
  }

  window.scrollTo({
    top: targetY,
    behavior: immediate ? "instant" : "smooth",
  });
  notifyScroll();
  return true;
}
