"use client";

import { WaveText } from "@/app/wave-text";
import { bookingUrl } from "@/lib/site-config";

type MvcareCtaProps = {
  variant?: "hero" | "close";
};

export function MvcareCta({ variant = "hero" }: MvcareCtaProps) {
  if (variant === "hero") {
    return (
      <div className="mvcare-cta mvcare-cta--hero">
        <a
          href={bookingUrl}
          className="mvcare-hero-book mob-link--wave"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg
            className="mvcare-hero-book-ring"
            viewBox="0 0 100 100"
            aria-hidden={true}
          >
            <circle
              className="mvcare-hero-book-ring-path"
              cx="50"
              cy="50"
              r="49.5"
            />
          </svg>
          <span className="mvcare-hero-book-label">
            <WaveText text="Acceder a MV Care" />
          </span>
        </a>
      </div>
    );
  }

  return (
    <div className="mvcare-cta">
      <a
        href={bookingUrl}
        className="btn-primary mvcare-btn"
        target="_blank"
        rel="noopener noreferrer"
      >
        Acceder a MV Care
      </a>
      <button type="button" className="btn-primary mvcare-btn js-open-reserva-panel">
        Reservar cita
      </button>
    </div>
  );
}
