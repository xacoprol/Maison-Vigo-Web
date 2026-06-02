"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

import { layoutServicioHeroOnce } from "@/lib/servicio-hero-layout";
import {
  resetServicioPageScroll,
  resetServicioPageScrollDeferred,
} from "@/lib/reset-servicio-scroll";

type ServicioPageClientProps = {
  children: React.ReactNode;
};

/**
 * Coordinación al entrar en `/servicios/*` por navegación cliente:
 * scroll arriba (antes del paint), medición del hero una vez estable.
 */
export function ServicioPageClient({ children }: ServicioPageClientProps) {
  const pathname = usePathname();
  const layoutDoneRef = useRef(false);

  useLayoutEffect(() => {
    layoutDoneRef.current = false;
    history.scrollRestoration = "manual";
    resetServicioPageScroll();
  }, [pathname]);

  useEffect(() => {
    resetServicioPageScrollDeferred();

    const notify = () => {
      layoutServicioHeroOnce();
      document.body.dispatchEvent(new Event("servicio-route-enter"));
      window.dispatchEvent(
        new CustomEvent("mv-scroll", {
          detail: { y: window.__mvLenis?.scroll ?? window.scrollY },
        }),
      );
    };

    const raf0 = requestAnimationFrame(() => {
      notify();
      layoutDoneRef.current = true;
    });

    const tFonts = window.setTimeout(() => {
      if (!layoutDoneRef.current) notify();
      else layoutServicioHeroOnce();
    }, 600);

    return () => {
      cancelAnimationFrame(raf0);
      window.clearTimeout(tFonts);
    };
  }, [pathname]);

  return children;
}
