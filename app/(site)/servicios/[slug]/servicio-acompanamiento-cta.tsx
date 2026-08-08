"use client";

import { ACOMPANAMIENTO_INQUIRY_OPEN_EVENT } from "@/lib/care-assist";

import { WaveText } from "../../../wave-text";

export function ServicioAcompanamientoCta() {
  return (
    <div className="servicio__hero-cta-wrap">
      <button
        type="button"
        className="servicio__hero-cta mob-link--wave"
        onClick={() => {
          document.body.dispatchEvent(
            new Event(ACOMPANAMIENTO_INQUIRY_OPEN_EVENT),
          );
        }}
      >
        <svg
          className="servicio__hero-cta-ring"
          viewBox="0 0 100 100"
          aria-hidden={true}
        >
          <circle
            className="servicio__hero-cta-ring-path"
            cx="50"
            cy="50"
            r="49.5"
          />
        </svg>
        <span className="servicio__hero-cta-label">
          <WaveText text="Reserva tu día" />
        </span>
      </button>
    </div>
  );
}
