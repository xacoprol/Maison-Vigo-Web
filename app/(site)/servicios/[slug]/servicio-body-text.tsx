"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

import { splitServicioBodySections } from "@/lib/servicio-body-sections";
import {
  SERVICIO_BODY_OPACITY_MIN,
  getServicioBodyScrollRevealProgress,
  servicioBodyOpacityFromProgress,
} from "@/lib/servicio-hero-scroll";

type ServicioBodyTextProps = {
  children: string;
};

const TEXT_OFFSET_CLASS =
  "servicio-text-offset servicio-text-offset--4 servicio-text-offset--2-md";

export function ServicioBodyText({ children }: ServicioBodyTextProps) {
  const pathname = usePathname();
  const copyRef = useRef<HTMLDivElement>(null);
  const sections = splitServicioBodySections(children);

  useLayoutEffect(() => {
    const copy = copyRef.current;
    if (!copy) return;
    copy.style.setProperty("--servicio-body-p", "0");
    copy.style.setProperty("--servicio-body-y", "0px");
    copy.classList.remove("is-revealed");
  }, [pathname, children]);

  useEffect(() => {
    const copy = copyRef.current;
    if (!copy) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const targetOpacityRef = { current: SERVICIO_BODY_OPACITY_MIN };
    const currentOpacityRef = { current: SERVICIO_BODY_OPACITY_MIN };
    const targetParallaxRef = { current: 0 };
    const currentParallaxRef = { current: 0 };
    let rafId = 0;

    const mobileMq = window.matchMedia("(max-width: 900px)");
    const isMobileLayout = () => mobileMq.matches;

    const applyState = (opacity: number, parallaxPx: number) => {
      const o = opacity.toFixed(4);
      const visible = opacity >= 0.008;
      copy.style.setProperty("--servicio-body-p", o);
      copy.style.setProperty("--servicio-body-y", `${parallaxPx.toFixed(1)}px`);
      copy.classList.toggle("is-revealed", visible);
    };

    const readTargets = () => {
      const hero = copy.closest<HTMLElement>(".servicio__hero");
      if (!hero || hero.offsetHeight < 48) return null;

      const progress = getServicioBodyScrollRevealProgress(copy, hero);
      const scrolled = Math.max(0, -hero.getBoundingClientRect().top);
      const mobile = isMobileLayout();

      return {
        opacity: servicioBodyOpacityFromProgress(progress),
        /* Móvil: sube con el scroll (factor mayor) para no quedarse pegado abajo. */
        parallaxPx: mobile ? -scrolled * 0.42 : -scrolled * 0.05,
      };
    };

    const tick = () => {
      const targetO = targetOpacityRef.current;
      const targetY = targetParallaxRef.current;
      let currentO = currentOpacityRef.current;
      let currentY = currentParallaxRef.current;
      const mobile = isMobileLayout();

      if (Math.abs(targetO - currentO) < 0.002) {
        currentO = targetO;
      } else {
        currentO += (targetO - currentO) * 0.22;
      }

      if (mobile) {
        /* Sin lerp lento: evita el “bote” al alcanzar el target. */
        currentY = targetY;
      } else if (Math.abs(targetY - currentY) < 0.2) {
        currentY = targetY;
      } else {
        currentY += (targetY - currentY) * 0.028;
      }

      currentOpacityRef.current = currentO;
      currentParallaxRef.current = currentY;
      applyState(currentO, currentY);

      if (
        Math.abs(targetO - currentO) > 0.002 ||
        (!mobile && Math.abs(targetY - currentY) > 0.35)
      ) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    };

    const schedule = (): boolean => {
      const targets = readTargets();
      if (!targets) return false;

      targetOpacityRef.current = targets.opacity;
      targetParallaxRef.current = targets.parallaxPx;

      if (prefersReducedMotion) {
        currentOpacityRef.current = 1;
        currentParallaxRef.current = 0;
        applyState(1, 0);
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        return true;
      }

      if (!rafId) rafId = requestAnimationFrame(tick);
      return true;
    };

    const scheduleWithRetry = () => {
      if (schedule()) return;
      let attempts = 0;
      const retry = () => {
        if (schedule() || attempts >= 80) return;
        attempts += 1;
        requestAnimationFrame(retry);
      };
      requestAnimationFrame(retry);
    };

    const onScroll = () => scheduleWithRetry();

    applyState(SERVICIO_BODY_OPACITY_MIN, 0);
    scheduleWithRetry();

    window.addEventListener("mv-scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    document.body.addEventListener("servicio-route-enter", onScroll);
    document.body.addEventListener("servicio-hero-media-ready", onScroll);

    const unsubLenis = window.__mvLenis?.on("scroll", onScroll);

    return () => {
      unsubLenis?.();
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mv-scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("resize", onScroll);
      document.body.removeEventListener("servicio-route-enter", onScroll);
      document.body.removeEventListener("servicio-hero-media-ready", onScroll);
      copy.style.removeProperty("--servicio-body-p");
      copy.style.removeProperty("--servicio-body-y");
      copy.classList.remove("is-revealed");
    };
  }, [pathname, children]);

  return (
    <div
      ref={copyRef}
      className="servicio__body-copy servicio__body-copy--scroll"
    >
      {sections.map((section, index) => (
        <p
          key={`${pathname}-section-${index}`}
          className={`servicio__body-text ${TEXT_OFFSET_CLASS}`}
        >
          {section}
        </p>
      ))}
    </div>
  );
}
