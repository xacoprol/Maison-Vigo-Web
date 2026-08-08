"use client";

import { ACOMPANAMIENTO_INQUIRY_OPEN_EVENT } from "@/lib/care-assist";

import { WaveText } from "../../../wave-text";

export function ServicioAcompanamientoCta() {
  return (
    <button
      type="button"
      className="servicio__hero-cta mob-link--wave"
      onClick={() => {
        document.body.dispatchEvent(
          new Event(ACOMPANAMIENTO_INQUIRY_OPEN_EVENT),
        );
      }}
    >
      <WaveText text="Reserva tu día" />
    </button>
  );
}
