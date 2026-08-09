"use client";

import { useEffect, useRef } from "react";

import { WaveText } from "@/app/wave-text";
import { ACOMPANAMIENTO_INQUIRY_OPEN_EVENT } from "@/lib/care-assist";
import { useTitleReveal } from "@/lib/use-title-reveal";

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

const ASSURANCES = [
  "Presencia in situ",
  "Misma calma que en Maison Vigo",
  "Bodas, eventos y traslados",
] as const;

export function ServicioAcompanamientoHow() {
  const sectionRef = useRef<HTMLElement>(null);
  const { ref: titleRef, displayClassName: titleDisplayClass } =
    useTitleReveal();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      section.style.setProperty("--how-bg-parallax", "0");
      return;
    }

    let target = 0;
    let current = 0;
    let rafId = 0;

    const updateTarget = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = rect.top + rect.height * 0.5;
      const raw = (vh * 0.5 - center) / (vh + rect.height * 0.5);
      target = Math.min(1, Math.max(-1, raw * 1.35));
    };

    const tick = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.001) {
        current = target;
      } else {
        current += diff * 0.12;
      }
      section.style.setProperty("--how-bg-parallax", current.toFixed(3));
      if (Math.abs(target - current) > 0.001) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    };

    const schedule = () => {
      updateTarget();
      if (!rafId) rafId = window.requestAnimationFrame(tick);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("mv-scroll", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("mv-scroll", schedule);
      if (rafId) window.cancelAnimationFrame(rafId);
      section.style.removeProperty("--how-bg-parallax");
    };
  }, []);

  const openForm = () => {
    document.body.dispatchEvent(new Event(ACOMPANAMIENTO_INQUIRY_OPEN_EVENT));
  };

  return (
    <section
      ref={sectionRef}
      className="servicio-acompanamiento-how"
      aria-labelledby="servicio-acompanamiento-how-heading"
    >
      <div className="servicio-acompanamiento-how__bg" aria-hidden={true} />
      <div className="servicio-acompanamiento-how__inner">
        <header className="servicio-acompanamiento-how__header">
          <p className="servicio-acompanamiento-how__eyebrow">Cómo funciona</p>
          <h2
            ref={titleRef}
            id="servicio-acompanamiento-how-heading"
            className={`servicio-acompanamiento-how__title ${titleDisplayClass}`}
          >
            <span className="mv-title-reveal">
              De la consulta al día del evento
            </span>
          </h2>
          <p className="servicio-acompanamiento-how__lead">
            Un proceso claro y cercano — sin prisas, con la misma atención que
            en Maison Vigo.
          </p>
        </header>

        <ol className="servicio-acompanamiento-how__list">
          {STEPS.map((step) => (
            <li key={step.n} className="servicio-acompanamiento-how__item">
              <span
                className="servicio-acompanamiento-how__n"
                aria-hidden={true}
              >
                {step.n}
              </span>
              <h3 className="servicio-acompanamiento-how__item-title">
                {step.title}
              </h3>
              <p className="servicio-acompanamiento-how__item-text">
                {step.text}
              </p>
            </li>
          ))}
        </ol>

        <p className="servicio-acompanamiento-how__assurance">
          {ASSURANCES.map((line, i) => (
            <span key={line} className="servicio-acompanamiento-how__assurance-item">
              {i > 0 ? (
                <span
                  className="servicio-acompanamiento-how__assurance-sep"
                  aria-hidden={true}
                >
                  ·
                </span>
              ) : null}
              {line}
            </span>
          ))}
        </p>

        <div className="servicio-acompanamiento-how__cta-wrap">
          <button
            type="button"
            className="servicio__hero-cta mob-link--wave"
            onClick={openForm}
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
      </div>
    </section>
  );
}
