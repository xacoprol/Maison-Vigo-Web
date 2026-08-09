"use client";

import { ACOMPANAMIENTO_INQUIRY_OPEN_EVENT } from "@/lib/care-assist";

import "./servicio-acompanamiento-how.css";

const STEPS = [
  {
    n: "01",
    title: "Consulta",
    text: "Nos cuentas fecha, lugar y qué necesita tu perro. Sin compromiso.",
  },
  {
    n: "02",
    title: "Conversación",
    text: "Afinamos presencia, tiempos y extras (traslado, portaalianzas…).",
  },
  {
    n: "03",
    title: "El día",
    text: "Estamos allí con calma para que podáis vivir el momento juntos.",
  },
] as const;

export function ServicioAcompanamientoHow() {
  const openForm = () => {
    document.body.dispatchEvent(new Event(ACOMPANAMIENTO_INQUIRY_OPEN_EVENT));
  };

  return (
    <section
      className="servicio-acompanamiento-how"
      aria-labelledby="servicio-acompanamiento-how-heading"
    >
      <div className="servicio-acompanamiento-how__inner">
        <p className="servicio-acompanamiento-how__eyebrow">Cómo funciona</p>
        <h2
          id="servicio-acompanamiento-how-heading"
          className="servicio-acompanamiento-how__title"
        >
          De la consulta al día del evento
        </h2>
        <ul className="servicio-acompanamiento-how__list">
          {STEPS.map((step) => (
            <li key={step.n} className="servicio-acompanamiento-how__item">
              <span className="servicio-acompanamiento-how__n" aria-hidden={true}>
                {step.n}
              </span>
              <h3 className="servicio-acompanamiento-how__item-title">
                {step.title}
              </h3>
              <p className="servicio-acompanamiento-how__item-text">{step.text}</p>
            </li>
          ))}
        </ul>
        <ul className="servicio-acompanamiento-how__bullets">
          <li>Presencia in situ — no es dejarlo en guardería.</li>
          <li>Misma calma y atención que en Maison Vigo.</li>
          <li>Bodas, eventos, sesiones foto y traslados a medida.</li>
        </ul>
        <button
          type="button"
          className="servicio-acompanamiento-how__cta nav-cta mob-link--wave"
          onClick={openForm}
        >
          Reserva tu día
        </button>
      </div>
    </section>
  );
}
