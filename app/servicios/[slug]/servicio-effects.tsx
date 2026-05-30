"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { layoutServicioHeroOnce } from "@/lib/servicio-hero-layout";

/**
 * Parallax del hero y ocultación del nav al entrar en el carrusel
 * scroll-locked. El scroll al entrar y `--servicio-body-top` los coordina
 * `ServicioPageClient` (no se toca `minHeight` del hero en scroll).
 */
export function ServicioEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".servicio__hero");
    const slideshowWrap = document.querySelector<HTMLElement>(
      ".servicio-slideshow-wrap",
    );
    const navbar = document.getElementById("navbar");
    if (!hero) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let target = 0;
    let current = 0;
    let rafId = 0;
    const getScrollY = () => window.__mvLenis?.scroll ?? window.scrollY;
    let lastScrollY = getScrollY();

    const updateTarget = () => {
      const rect = hero.getBoundingClientRect();
      const vh = window.innerHeight;
      const heroH = hero.offsetHeight;
      const travel = Math.max(heroH * 0.78, vh * 0.62);
      target = -rect.top / travel;
      target = Math.min(1, Math.max(0, target));
    };

    const updateNavVisibility = (scrollY: number) => {
      if (!navbar) return;

      const scrollDelta = scrollY - lastScrollY;
      const isScrollingDown = scrollDelta > 2;
      const isScrollingUp = scrollDelta < -2;

      if (!slideshowWrap) {
        const heroPassed = scrollY > hero.offsetHeight - 20;
        if (heroPassed && isScrollingDown) {
          navbar.classList.add("nav-hidden");
        } else if (!heroPassed || isScrollingUp || scrollY < 10) {
          navbar.classList.remove("nav-hidden");
        }
        lastScrollY = scrollY;
        return;
      }

      const wrapOffset = slideshowWrap.offsetTop;
      const wrapTop = wrapOffset - scrollY;
      const atSlideshow = wrapTop <= 4;
      const beforeSlideshow = wrapTop > 96;

      if (atSlideshow && !isScrollingUp) {
        navbar.classList.add("nav-hidden");
      } else if (beforeSlideshow || isScrollingUp || scrollY < 10) {
        navbar.classList.remove("nav-hidden");
      }

      lastScrollY = scrollY;
    };

    const tick = () => {
      if (prefersReducedMotion) {
        hero.style.setProperty("--servicio-parallax", "0");
        current = 0;
        target = 0;
        rafId = 0;
        return;
      }

      const diff = target - current;
      if (Math.abs(diff) < 0.0008) {
        current = target;
      } else {
        current += diff * 0.12;
      }

      hero.style.setProperty("--servicio-parallax", current.toFixed(3));

      if (Math.abs(target - current) > 0.0008) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    };

    const schedule = (scrollY?: number) => {
      updateTarget();
      updateNavVisibility(
        typeof scrollY === "number" ? scrollY : getScrollY(),
      );
      if (!rafId) rafId = window.requestAnimationFrame(tick);
    };

    const onMvScroll = (event: Event) => {
      const y = (event as CustomEvent<{ y: number }>).detail?.y;
      schedule(typeof y === "number" ? y : undefined);
    };

    const onNativeScroll = () => schedule();
    const onResize = () => {
      layoutServicioHeroOnce();
      schedule();
    };
    const onRouteEnter = () => {
      layoutServicioHeroOnce();
      schedule(0);
    };

    schedule(0);

    const unsubLenis = window.__mvLenis?.on("scroll", () =>
      schedule(getScrollY()),
    );

    window.addEventListener("mv-scroll", onMvScroll);
    window.addEventListener("scroll", onNativeScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.body.addEventListener("servicio-route-enter", onRouteEnter);
    document.body.addEventListener("servicio-hero-media-ready", onResize);

    return () => {
      unsubLenis?.();
      window.removeEventListener("mv-scroll", onMvScroll);
      window.removeEventListener("scroll", onNativeScroll);
      window.removeEventListener("resize", onResize);
      document.body.removeEventListener("servicio-route-enter", onRouteEnter);
      document.body.removeEventListener("servicio-hero-media-ready", onResize);
      if (rafId) window.cancelAnimationFrame(rafId);
      hero.style.removeProperty("--servicio-parallax");
      navbar?.classList.remove("nav-hidden");
    };
  }, [pathname]);

  return null;
}
