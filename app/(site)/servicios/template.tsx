"use client";

import { useLayoutEffect } from "react";

import { resetServicioPageScroll } from "@/lib/reset-servicio-scroll";

/**
 * Se remonta al entrar en `/servicios/*` (incl. desde la home).
 * Garantiza scroll 0 antes del primer paint de la ficha.
 */
export default function ServiciosTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  useLayoutEffect(() => {
    history.scrollRestoration = "manual";
    resetServicioPageScroll();
  });

  return children;
}
