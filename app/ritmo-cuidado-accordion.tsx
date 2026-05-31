"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { RITMO_CUIDADO_STEPS } from "@/lib/ritmo-cuidado-steps";

const IMG_PANEL_W = 347;
const IMG_PANEL_H = 231;
const IMG_TIJERA = "/assets/images/tijera.webp";
const IMG_DESLANADOR = "/assets/images/peine.webp";
/** Tamaño nativo de los archivos (px) */
const TIJERA_W = 553;
const TIJERA_H = 552;
const DESLANADOR_W = 703;
const DESLANADOR_H = 702;

const PARALLAX_FACTOR_TIJERA = 0.16;
const PARALLAX_FACTOR_DESLANADOR = -0.11;
const PARALLAX_LERP = 0.1;

export function RitmoCuidadoAccordion() {
  const rootRef = useRef<HTMLElement>(null);
  const listSurfaceRef = useRef<HTMLDivElement>(null);
  const tijeraParallaxRef = useRef<HTMLSpanElement>(null);
  const deslanadorParallaxRef = useRef<HTMLSpanElement>(null);
  const smoothYRef = useRef(0);
  const rafLoopRef = useRef(0);
  const observingRef = useRef(false);
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
    const surface = listSurfaceRef.current;
    const tijeraEl = tijeraParallaxRef.current;
    const desEl = deslanadorParallaxRef.current;
    if (!surface || !tijeraEl || !desEl) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const stopLoop = () => {
      observingRef.current = false;
      cancelAnimationFrame(rafLoopRef.current);
      rafLoopRef.current = 0;
    };

    const tick = () => {
      if (!observingRef.current) return;
      const rect = surface.getBoundingClientRect();
      const deltaFromViewportCenter =
        rect.top + rect.height * 0.5 - window.innerHeight * 0.5;
      const target = deltaFromViewportCenter;
      let y = smoothYRef.current;
      if (reducedMotion) {
        y = target;
      } else {
        y += (target - y) * PARALLAX_LERP;
      }
      smoothYRef.current = y;
      tijeraEl.style.transform = `translate3d(0, ${
        y * PARALLAX_FACTOR_TIJERA
      }px, 0)`;
      desEl.style.transform = `translate3d(0, ${
        y * PARALLAX_FACTOR_DESLANADOR
      }px, 0)`;
      rafLoopRef.current = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (observingRef.current) return;
      observingRef.current = true;
      cancelAnimationFrame(rafLoopRef.current);
      rafLoopRef.current = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { root: null, rootMargin: "15% 0px 15% 0px", threshold: 0 },
    );
    io.observe(surface);

    requestAnimationFrame(() => {
      const r = surface.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        startLoop();
      }
    });

    return () => {
      stopLoop();
      io.disconnect();
    };
  }, []);

  const toggle = useCallback((i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  }, []);

  const floatsHidden = openIndex !== null;

  return (
    <section
      ref={rootRef}
      id="ritmo-cuidado"
      className={"ritmo-cuidado" + (inView ? " ritmo-cuidado--inview" : "")}
      aria-labelledby="ritmo-cuidado-heading"
    >
      <div className="ritmo-cuidado__inner">
        <p className="ritmo-cuidado__kicker">
          {RITMO_CUIDADO_STEPS.length === 1
            ? "1 momento"
            : `${RITMO_CUIDADO_STEPS.length} momentos`}
        </p>
        <p className="ritmo-cuidado__eyebrow" id="ritmo-cuidado-heading">
          EL RITMO DEL CUIDADO
        </p>

        <div className="ritmo-cuidado__list-surface" ref={listSurfaceRef}>
          <ul className="ritmo-cuidado__list" role="list">
            {RITMO_CUIDADO_STEPS.map((step, i) => {
              const isOpen = openIndex === i;
              return (
                <li
                  key={step.title}
                  className={
                    "ritmo-cuidado__item" +
                    (isOpen ? " ritmo-cuidado__item--open" : "") +
                    (inView ? " ritmo-cuidado__item--visible" : "")
                  }
                >
                  <div className="ritmo-cuidado__item-head">
                    <button
                      type="button"
                      className="ritmo-cuidado__trigger"
                      aria-expanded={isOpen}
                      aria-controls={`ritmo-panel-${i}`}
                      id={`ritmo-trigger-${i}`}
                      onClick={() => toggle(i)}
                      style={{
                        transitionDelay: inView ? `${0.06 + i * 0.07}s` : "0s",
                      }}
                    >
                      <span className="ritmo-cuidado__trigger-body">
                        <span
                          className="ritmo-cuidado__trigger-title"
                          data-title={step.title}
                        >
                          {step.title}
                        </span>
                        <span className="ritmo-cuidado__toggle" aria-hidden={true}>
                          <svg
                            className="ritmo-cuidado__ring"
                            viewBox="0 0 100 100"
                            aria-hidden={true}
                          >
                            <circle
                              className="ritmo-cuidado__ring-path"
                              cx={50}
                              cy={50}
                              r={50}
                            />
                          </svg>
                          <span className="ritmo-cuidado__toggle-mark">
                            <span className="servicios-carousel__badge-disc" />
                            {isOpen ? (
                              <svg
                                className="ritmo-cuidado__toggle-svg ritmo-cuidado__toggle-svg--minus"
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
                                className="servicios-carousel__plus ritmo-cuidado__toggle-svg ritmo-cuidado__toggle-svg--plus"
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
                      </span>
                    </button>

                    <div
                      id={`ritmo-panel-${i}`}
                      role="region"
                      aria-labelledby={`ritmo-trigger-${i}`}
                      aria-hidden={!isOpen}
                      className={
                        "ritmo-cuidado__panel" +
                        (isOpen ? " ritmo-cuidado__panel--open" : "")
                      }
                    >
                      <div className="ritmo-cuidado__panel-grid">
                        <div className="ritmo-cuidado__img-wrap">
                          <Image
                            src={step.img}
                            alt=""
                            width={IMG_PANEL_W}
                            height={IMG_PANEL_H}
                            className="ritmo-cuidado__img"
                            sizes="(max-width: 900px) 88vw, min(520px, 72vw)"
                            quality={75}
                            loading="lazy"
                          />
                        </div>
                        <div className="ritmo-cuidado__desc">
                          {step.desc.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                          ))}
                          {step.moreHref && step.moreLead ? (
                            <Link
                              href={step.moreHref}
                              className="ritmo-cuidado__more"
                            >
                              <span className="ritmo-cuidado__more-text">
                                {step.moreLead}
                              </span>
                              {step.moreLogoSrc ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={step.moreLogoSrc}
                                  alt={step.moreLogoAlt ?? "MV Care"}
                                  width={248}
                                  height={74}
                                  className="ritmo-cuidado__more-logo"
                                  decoding="async"
                                />
                              ) : null}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div
            className={
              "ritmo-cuidado__float ritmo-cuidado__float--tijera" +
              (floatsHidden ? " ritmo-cuidado__float--recede" : "")
            }
            aria-hidden={true}
          >
            <span
              ref={tijeraParallaxRef}
              className="ritmo-cuidado__float-parallax"
            >
              <Image
                src={IMG_TIJERA}
                alt=""
                width={TIJERA_W}
                height={TIJERA_H}
                className="ritmo-cuidado__float-img ritmo-cuidado__float-img--tijera"
                sizes="360px"
                quality={75}
                loading="lazy"
              />
            </span>
          </div>
          <div
            className={
              "ritmo-cuidado__float ritmo-cuidado__float--deslanador" +
              (floatsHidden ? " ritmo-cuidado__float--recede" : "")
            }
            aria-hidden={true}
          >
            <span
              ref={deslanadorParallaxRef}
              className="ritmo-cuidado__float-parallax"
            >
              <Image
                src={IMG_DESLANADOR}
                alt=""
                width={DESLANADOR_W}
                height={DESLANADOR_H}
                className="ritmo-cuidado__float-img ritmo-cuidado__float-img--deslanador"
                sizes="330px"
                quality={75}
                loading="lazy"
              />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
