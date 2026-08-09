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
  const floatRef = useRef<HTMLElement>(null);
  const scissorsRef = useRef<HTMLSpanElement>(null);
  const hairsRef = useRef<HTMLSpanElement>(null);
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

  /** Clan-clan sincronizado: cierre de hojas + pelos de perro que saltan y caen. */
  useEffect(() => {
    if (!inView) return;
    const scissors = scissorsRef.current;
    const hairsHost = hairsRef.current;
    if (!scissors || !hairsHost) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const bladeA = scissors.querySelector<HTMLElement>(
      ".servicio-servicios__blade--a",
    );
    const bladeB = scissors.querySelector<HTMLElement>(
      ".servicio-servicios__blade--b",
    );
    if (!bladeA || !bladeB) return;

    let cancelled = false;
    const timers: number[] = [];
    const liveHairs = new Set<HTMLElement>();

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(() => resolve(), ms);
        timers.push(id);
      });

    // Colores sólidos; la opacidad la lleva la animación (si no, casi no se ven).
    const DOG_FUR = [
      "#f7f4ee",
      "#efe6d4",
      "#e2c9a0",
      "#d4af7a",
      "#c4a484",
      "#b08968",
      "#9a734f",
      "#7a5a3a",
    ];

    const setClosed = (closed: boolean) => {
      bladeA.classList.toggle("is-closed", closed);
      bladeB.classList.toggle("is-closed", closed);
    };

    const spawnFurBurst = () => {
      const count = 14 + Math.floor(Math.random() * 6);
      for (let i = 0; i < count; i++) {
        const el = document.createElement("span");
        el.className = "servicio-servicios__fur";

        // Finos pero visibles; curva marcada tipo pelo suelto (no recto).
        const len = 12 + Math.random() * 20;
        const thick = 1.25 + Math.random() * 1.15;
        const color = DOG_FUR[Math.floor(Math.random() * DOG_FUR.length)]!;
        const side = Math.random() > 0.5 ? 1 : -1;
        // Arco en C (mismo lado) + punta que se enrolla un poco más.
        const bend = side * (7 + Math.random() * 11);
        const tip = bend * (0.55 + Math.random() * 0.55);
        const midY = 14 + Math.random() * 10;
        // Origen cerca del cruce de hojas.
        const startX = 38 + Math.random() * 24;
        const startY = 54 + Math.random() * 10;
        // Abanico natural hacia abajo, con algo de lateral.
        const angle = (-60 + Math.random() * 120) * (Math.PI / 180);
        const speed = 0.6 + Math.random() * 0.85;
        const driftX = Math.sin(angle) * (32 + Math.random() * 58) * speed;
        const fallY = 60 + Math.random() * 85 * speed;
        const rot0 = -28 + Math.random() * 56;
        const spin = side * (14 + Math.random() * 34);
        const rot1 = rot0 + spin;
        const delay = Math.random() * 80;

        el.style.left = `${startX}%`;
        el.style.top = `${startY}%`;
        el.style.setProperty("--fur-len", `${len.toFixed(1)}px`);
        el.style.setProperty("--fur-color", color);
        // viewBox ancho para que el arco no se recorte.
        el.innerHTML = `<svg viewBox="0 0 36 48" aria-hidden="true" focusable="false"><path d="M18 0 C ${18 + bend} ${midY.toFixed(1)}, ${18 + bend * 1.15} 34, ${18 + tip} 48" fill="none" stroke="currentColor" stroke-width="${thick.toFixed(2)}" stroke-linecap="round"/></svg>`;

        hairsHost.appendChild(el);
        liveHairs.add(el);

        const fallMs = 1050 + Math.random() * 750;
        const popX = driftX * 0.14;
        const popY = -(4 + Math.random() * 9);

        const delayId = window.setTimeout(() => {
          if (cancelled) {
            el.remove();
            liveHairs.delete(el);
            return;
          }
          const anim = el.animate(
            [
              {
                opacity: 0,
                transform: `translate3d(0px, 1px, 0) rotate(${rot0}deg) scaleY(0.7)`,
                offset: 0,
              },
              {
                opacity: 1,
                transform: `translate3d(${popX.toFixed(1)}px, ${popY.toFixed(1)}px, 0) rotate(${(rot0 + spin * 0.15).toFixed(1)}deg) scaleY(1)`,
                offset: 0.07,
              },
              {
                opacity: 0.92,
                transform: `translate3d(${(driftX * 0.42).toFixed(1)}px, ${(fallY * 0.32).toFixed(1)}px, 0) rotate(${(rot0 + spin * 0.5).toFixed(1)}deg) scaleY(1)`,
                offset: 0.4,
              },
              {
                opacity: 0,
                transform: `translate3d(${driftX.toFixed(1)}px, ${fallY.toFixed(1)}px, 0) rotate(${rot1.toFixed(1)}deg) scaleY(1.02)`,
                offset: 1,
              },
            ],
            {
              duration: fallMs,
              easing: "cubic-bezier(0.22, 0.18, 0.28, 1)",
              fill: "forwards",
            },
          );
          void anim.finished.then(() => {
            el.remove();
            liveHairs.delete(el);
          });
        }, delay);
        timers.push(delayId);
      }
    };

    const snip = async () => {
      setClosed(true);
      await wait(30);
      if (cancelled) return;
      spawnFurBurst();
      await wait(160);
      if (cancelled) return;
      setClosed(false);
      await wait(90);
    };

    const loop = async () => {
      await wait(1400);
      while (!cancelled) {
        await snip();
        if (cancelled) break;
        await wait(180);
        await snip();
        if (cancelled) break;
        const pause = 5500 + Math.floor(Math.random() * 2000);
        await wait(pause);
      }
    };

    void loop();

    return () => {
      cancelled = true;
      for (const id of timers) window.clearTimeout(id);
      setClosed(false);
      for (const el of liveHairs) el.remove();
      liveHairs.clear();
    };
  }, [inView]);

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
            className={
              "servicio-servicios__title mv-title-display" +
              (inView ? " is-revealed" : "")
            }
            id="servicio-servicios-heading"
          >
            <span className="servicio-servicios__title-anchor">
              <span
                ref={floatRef}
                className="servicio-servicios__float"
                aria-hidden={true}
              >
                <span
                  ref={scissorsRef}
                  className="servicio-servicios__scissors"
                >
                  <span className="servicio-servicios__blade servicio-servicios__blade--a">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/images/servicios-blade-a.png"
                      alt=""
                      width={1100}
                      height={1100}
                      decoding="async"
                    />
                  </span>
                  <span className="servicio-servicios__blade servicio-servicios__blade--b">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/assets/images/servicios-blade-b.png"
                      alt=""
                      width={1100}
                      height={1100}
                      decoding="async"
                    />
                  </span>
                </span>
                <span
                  ref={hairsRef}
                  className="servicio-servicios__hairs"
                />
              </span>
              <span className="servicio-servicios__title-text mv-title-reveal">
                Servicios
              </span>
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
