"use client";

import { useSyncExternalStore } from "react";

import { WaveText } from "./wave-text";

/** Orden móvil (izquierda → derecha) */
export const ORDER_MOBILE = [
  "Grooming",
  "Bienestar",
  "Guardería Familiar",
  "Acompañamiento",
  "Educación",
] as const;

/** Escritorio (izquierda → derecha) */
export const ORDER_DESKTOP = [
  "Bienestar",
  "Acompañamiento",
  "Grooming",
  "Guardería Familiar",
  "Educación",
] as const;

export type ServiceId = (typeof ORDER_MOBILE)[number];

export const MOBILE_MQ = "(max-width: 900px)";
export const NARROW_MQ = "(max-width: 680px)";

/** ~1.85 celdas visibles: círculos más grandes, sin solape. */
export const MOBILE_SLIDES_PER_VIEW = 1.85;
export const MOBILE_SLIDES_PER_VIEW_NARROW = 1.58;
/** Separación entre orbes (0 = pegados sin solaparse). */
export const MOBILE_SLIDE_SPACING = 0;

export const SERVICE_IMAGES: Record<ServiceId, string> = {
  Grooming: "/grooming.webp",
  Bienestar: "/cuidado.webp",
  "Guardería Familiar": "/guarderia.webp",
  Acompañamiento: "/acompanamiento.webp",
  Educación: "/educacion.webp",
};

export const SERVICE_SUBTITLES: Record<ServiceId, string> = {
  Grooming:
    "Grooming con dermocosmética, observación y un ritmo de trabajo sereno.",
  Bienestar:
    "Diagnóstico, cosmética y cuidado de piel y manto con continuidad.",
  "Guardería Familiar":
    "Estancias de día en MV Home: entorno familiar, reducido y supervisado.",
  Acompañamiento:
    "Presencia y cuidado en los momentos en los que no puedes estar con ellos.",
  Educación:
    "Acompañamiento en convivencia, equilibrio y bienestar emocional.",
};

const LABEL_LINES: Partial<Record<ServiceId, readonly string[]>> = {
  "Guardería Familiar": ["Guardería", "Familiar"],
};

function subscribeMediaQuery(
  query: string,
  onStoreChange: () => void,
): () => void {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

export function ServiceOrbLabel({ label }: { label: ServiceId }) {
  const narrow = useSyncExternalStore(
    (cb) => subscribeMediaQuery(NARROW_MQ, cb),
    () => window.matchMedia(NARROW_MQ).matches,
    () => false,
  );

  const lines =
    narrow && LABEL_LINES[label] ? LABEL_LINES[label]! : [label];

  if (lines.length === 1) {
    return (
      <span className="servicios-carousel__label mob-link--wave">
        <WaveText
          text={lines[0]}
          screenReaderDuplicate={false}
          charStaggerMs={14}
        />
      </span>
    );
  }

  return (
    <span
      className="servicios-carousel__label servicios-carousel__label--stacked mob-link--wave"
      aria-label={label}
    >
      {lines.map((line) => (
        <span key={line} className="servicios-carousel__label-line">
          <WaveText
            text={line}
            screenReaderDuplicate={false}
            charStaggerMs={14}
          />
        </span>
      ))}
    </span>
  );
}
