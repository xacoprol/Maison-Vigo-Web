"use client";

import { bookingUrl } from "@/lib/site-config";

type MvcareCtaProps = {
  variant?: "hero" | "close";
};

export function MvcareCta({ variant = "hero" }: MvcareCtaProps) {
  const btnClass =
    variant === "hero"
      ? "btn-primary mvcare-btn mvcare-btn--hero"
      : "btn-primary mvcare-btn";

  return (
    <div className={`mvcare-cta${variant === "hero" ? " mvcare-cta--hero" : ""}`}>
      <a
        href={bookingUrl}
        className={btnClass}
        target="_blank"
        rel="noopener noreferrer"
      >
        Acceder a MV Care
      </a>
      <button type="button" className={`${btnClass} js-open-reserva-panel`}>
        Reservar cita
      </button>
    </div>
  );
}
