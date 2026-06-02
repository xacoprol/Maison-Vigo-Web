"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  getServicioServiciosItems,
  type ServicioServiciosItem,
} from "@/lib/servicio-servicios-data";
import type { ServicioSlug } from "@/lib/servicios-data";

import "./servicio-servicios-section.css";

type ServicioServiciosSectionProps = {
  slug: ServicioSlug;
};

export function ServicioServiciosSection({ slug }: ServicioServiciosSectionProps) {
  const items: ServicioServiciosItem[] = getServicioServiciosItems(slug);
  const rootRef = useRef<HTMLElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const float = floatRef.current;
    const section = rootRef.current;
    if (!float || !section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let targetY = 0;
    let currentY = 0;
    let rafId = 0;

    const readTarget = () => {
      const rect = float.getBoundingClientRect();
      const vh = window.innerHeight;
      const anchor = rect.top + rect.height * 0.45;
      return (anchor - vh * 0.42) * 0.06;
    };

    const applyY = (y: number) => {
      float.style.setProperty("--servicio-servicios-float-y", `${y.toFixed(1)}px`);
    };

    const tick = () => {
      const diff = targetY - currentY;
      if (Math.abs(diff) < 0.15) {
        currentY = targetY;
      } else {
        currentY += diff * 0.12;
      }
      applyY(currentY);
      if (Math.abs(targetY - currentY) > 0.15) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    };

    const schedule = () => {
      if (prefersReducedMotion) {
        targetY = 0;
        currentY = 0;
        applyY(0);
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        return;
      }
      targetY = readTarget();
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    schedule();
    window.addEventListener("mv-scroll", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    const unsubLenis = window.__mvLenis?.on("scroll", schedule);

    return () => {
      unsubLenis?.();
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("mv-scroll", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      float.style.removeProperty("--servicio-servicios-float-y");
    };
  }, []);

  const toggle = useCallback((i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  }, []);

  return (
    <section
      ref={rootRef}
      className={
        "servicio-servicios" + (inView ? " servicio-servicios--inview" : "")
      }
      aria-labelledby="servicio-servicios-heading"
    >
      <div className="servicio-servicios__inner">
        <div className="servicio-servicios__title-zone">
          <h2
            className="servicio-servicios__title"
            id="servicio-servicios-heading"
          >
            <span className="servicio-servicios__title-anchor">
              <span
                ref={floatRef}
                className="servicio-servicios__float"
                aria-hidden={true}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/images/servicios.png"
                  alt=""
                  width={480}
                  height={686}
                  decoding="async"
                />
              </span>
              <span className="servicio-servicios__title-text">Servicios</span>
            </span>
          </h2>
        </div>

        <ul className="servicio-servicios__list" role="list">
          {items.map((step, i) => {
            const isOpen = openIndex === i;
            return (
              <li
                key={step.title}
                className={
                  "servicio-servicios__item" +
                  (isOpen ? " servicio-servicios__item--open" : "") +
                  (inView ? " servicio-servicios__item--visible" : "")
                }
              >
                <div className="servicio-servicios__item-head">
                  <button
                    type="button"
                    className="servicio-servicios__trigger"
                    aria-expanded={isOpen}
                    aria-controls={`servicio-servicios-panel-${i}`}
                    id={`servicio-servicios-trigger-${i}`}
                    onClick={() => toggle(i)}
                    style={{
                      transitionDelay: inView ? `${0.06 + i * 0.07}s` : "0s",
                    }}
                  >
                    <span
                      className="servicio-servicios__trigger-title"
                      data-title={step.title}
                    >
                      {step.title}
                    </span>
                    <span className="servicio-servicios__toggle" aria-hidden={true}>
                      <svg
                        className="servicio-servicios__ring"
                        viewBox="0 0 100 100"
                        aria-hidden={true}
                      >
                        <circle
                          className="servicio-servicios__ring-path"
                          cx={50}
                          cy={50}
                          r={50}
                        />
                      </svg>
                      <span className="servicio-servicios__toggle-mark">
                        <span className="servicios-carousel__badge-disc" />
                        {isOpen ? (
                          <svg
                            className="servicio-servicios__toggle-svg servicio-servicios__toggle-svg--minus"
                            viewBox="0 0 30 30"
                            aria-hidden={true}
                          >
                            <path
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              d="M9 15h12"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="servicios-carousel__plus servicio-servicios__toggle-svg servicio-servicios__toggle-svg--plus"
                            viewBox="0 0 30 30"
                            aria-hidden={true}
                          >
                            <path
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              d="M15 9v12M9 15h12"
                            />
                          </svg>
                        )}
                      </span>
                    </span>
                  </button>

                  <div
                    id={`servicio-servicios-panel-${i}`}
                    role="region"
                    aria-labelledby={`servicio-servicios-trigger-${i}`}
                    aria-hidden={!isOpen}
                    className={
                      "servicio-servicios__panel" +
                      (isOpen ? " servicio-servicios__panel--open" : "")
                    }
                  >
                    <div className="servicio-servicios__panel-inner">
                      <div className="servicio-servicios__desc">
                        {step.desc.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
