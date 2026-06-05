"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { servicioSlugFromLabel } from "@/lib/servicios-data";

import { WaveText } from "./wave-text";

/** Orden móvil (izquierda → derecha) */
const ORDER_MOBILE = [
  "Grooming",
  "Bienestar",
  "Guardería Familiar",
  "Acompañamiento",
  "Educación",
] as const;

/**
 * Escritorio (izquierda → derecha): Acompañamiento antes que Grooming;
 * el track se centra como bloque de 5 (½ + 3 + ½ en el viewport).
 */
const ORDER_DESKTOP = [
  "Bienestar",
  "Acompañamiento",
  "Grooming",
  "Guardería Familiar",
  "Educación",
] as const;

type ServiceId = (typeof ORDER_MOBILE)[number];

const MOBILE_MQ = "(max-width: 900px)";

const SERVICE_IMAGES: Record<ServiceId, string> = {
  Grooming: "/grooming.webp",
  Bienestar: "/cuidado.webp",
  "Guardería Familiar": "/guarderia.webp",
  Acompañamiento: "/acompanamiento.webp",
  Educación: "/educacion.webp",
};

const SERVICE_SUBTITLES: Record<ServiceId, string> = {
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

const N = ORDER_MOBILE.length;

function subscribeMediaQuery(
  query: string,
  onStoreChange: () => void,
): () => void {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

const subscribeMobileMq = (onStoreChange: () => void) =>
  subscribeMediaQuery(MOBILE_MQ, onStoreChange);

const getMobileMqSnapshot = () => window.matchMedia(MOBILE_MQ).matches;

/** SSR / hidratación: siempre escritorio hasta montar en cliente. */
const getMobileMqServerSnapshot = () => false;

function wrapTranslate(x: number, maxT: number, cycle: number): number {
  let v = x;
  while (v > 0) v -= cycle;
  while (v < maxT) v += cycle;
  return v;
}

function isServiceId(value: string): value is ServiceId {
  return value in SERVICE_IMAGES;
}

export function ServiciosCarousel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const maxTRef = useRef(0);
  const centerTRef = useRef(0);
  const cyclePxRef = useRef(0);
  const isMobileRef = useRef(false);
  const rafRef = useRef<number>(0);
  const reducedMotionRef = useRef(false);
  const sectionInViewRef = useRef(false);
  /** Móvil: arrastre horizontal; puntero inicial hasta umbral de movimiento */
  const mobileDragRef = useRef<{
    pointerId: number | null;
    startX: number;
    startTarget: number;
    active: boolean;
  }>({ pointerId: null, startX: 0, startTarget: 0, active: false });
  const [highlightedId, setHighlightedId] = useState<ServiceId>("Grooming");
  const highlightedIdRef = useRef<ServiceId>("Grooming");
  const hoverIdRef = useRef<ServiceId | null>(null);
  const isMobile = useSyncExternalStore(
    subscribeMobileMq,
    getMobileMqSnapshot,
    getMobileMqServerSnapshot,
  );

  const applyTransform = useCallback((x: number) => {
    const tr = trackRef.current;
    if (tr) tr.style.transform = `translate3d(${x}px,0,0)`;
  }, []);

  const setHighlight = useCallback((id: ServiceId) => {
    if (highlightedIdRef.current === id) return;
    highlightedIdRef.current = id;
    setHighlightedId(id);
  }, []);

  /** Foto central según el orbe más cercano al centro del viewport. */
  const syncHighlightFromTranslate = useCallback(
    (translateX: number, cellW: number, labels: readonly string[]) => {
      const vp = viewportRef.current;
      if (!vp || cellW < 8 || labels.length === 0) return;

      const cs = window.getComputedStyle(vp);
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;
      const centerX = padL + (vp.clientWidth - padL - padR) / 2;

      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < labels.length; i++) {
        const cellCenter = i * cellW + cellW / 2 + translateX;
        const dist = Math.abs(cellCenter - centerX);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      const label = labels[bestIdx];
      if (isServiceId(label)) setHighlight(label);
    },
    [setHighlight],
  );

  const measure = useCallback((): boolean => {
    const vp = viewportRef.current;
    const tr = trackRef.current;
    if (!vp || !tr) return false;
    const mobile = window.matchMedia(MOBILE_MQ).matches;
    isMobileRef.current = mobile;

    const cs = window.getComputedStyle(vp);
    const padX =
      (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const vw = Math.max(0, vp.clientWidth - padX);
    const cells = tr.querySelectorAll<HTMLElement>(".servicios-carousel__cell");
    if (cells.length === 0) return false;

    /** Ancho explícito: el track es `max-content` y el % no resuelve bien en flex. */
    const cellW = mobile ? vw / 2.5 : vw / 4;
    cells.forEach((cell) => {
      cell.style.flex = `0 0 ${cellW}px`;
      cell.style.width = `${cellW}px`;
    });

    const cw = cellW;
    if (cw < 8 || vw < 8) return false;

    const tw = cw * cells.length;
    const maxT = Math.min(0, vw - tw);
    maxTRef.current = maxT;
    cyclePxRef.current = cw * N;

    const order = mobile ? ORDER_MOBILE : ORDER_DESKTOP;
    const gi = order.indexOf("Grooming");
    let centerX: number;
    if (mobile) {
      const groomIdx = N + gi;
      centerX = vw / 2 - (groomIdx * cw + cw / 2);
    } else {
      /** Centrar el bloque de 5: se ven 4 celdas de ancho (½ + 3 + ½) */
      const trackCenterPx = (N * cw) / 2;
      centerX = vw / 2 - trackCenterPx;
    }
    centerX = Math.max(maxT, Math.min(0, centerX));

    centerTRef.current = centerX;

    if (reducedMotionRef.current) {
      currentRef.current = centerX;
      targetRef.current = centerX;
      applyTransform(centerX);
      return true;
    }
    currentRef.current = centerX;
    targetRef.current = centerX;
    applyTransform(centerX);
    const labels = mobile
      ? [...ORDER_MOBILE, ...ORDER_MOBILE, ...ORDER_MOBILE]
      : [...ORDER_DESKTOP];
    syncHighlightFromTranslate(centerX, cw, labels);
    return true;
  }, [applyTransform, syncHighlightFromTranslate]);

  /** Reintenta hasta que el layout del track tenga medidas reales. */
  const measureWithRetry = useCallback(() => {
    if (measure()) return;
    let attempts = 0;
    const maxAttempts = 48;
    const tick = () => {
      if (measure() || attempts >= maxAttempts) return;
      attempts += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [measure]);

  useLayoutEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    isMobileRef.current = isMobile;
    measureWithRetry();
  }, [isMobile, measureWithRetry]);

  useEffect(() => {
    measureWithRetry();
    const ro = new ResizeObserver(() => measureWithRetry());
    const vp = viewportRef.current;
    const tr = trackRef.current;
    if (vp) ro.observe(vp);
    if (tr) ro.observe(tr);
    window.addEventListener("resize", measureWithRetry);

    const onFontsReady = () => measureWithRetry();
    document.fonts?.ready.then(onFontsReady);

    const onIntroComplete = () => measureWithRetry();
    document.body.addEventListener("mv-intro-complete", onIntroComplete);

    const revealLayer = document.querySelector(
      ".servicios-carousel-wrap.reveal",
    );
    const revealObserver =
      revealLayer &&
      new MutationObserver(() => {
        if (revealLayer.classList.contains("visible")) measureWithRetry();
      });
    if (revealLayer && revealObserver) {
      revealObserver.observe(revealLayer, {
        attributes: true,
        attributeFilter: ["class"],
      });
      if (revealLayer.classList.contains("visible")) measureWithRetry();
    }

    return () => {
      ro.disconnect();
      revealObserver?.disconnect();
      window.removeEventListener("resize", measureWithRetry);
      document.body.removeEventListener("mv-intro-complete", onIntroComplete);
    };
  }, [measureWithRetry]);

  useEffect(() => {
    measureWithRetry();
  }, [isMobile, measureWithRetry]);

  /** Escritorio: barre el carrusel con la X del puntero en toda la sección #servicios (título + carrusel). */
  useEffect(() => {
    const section = document.getElementById("servicios");
    if (!section) return;

    const resetToCenter = () => {
      if (reducedMotionRef.current || isMobileRef.current) return;
      hoverIdRef.current = null;
      targetRef.current = centerTRef.current;
      setHighlight("Grooming");
    };

    const onSectionPointerMove = (e: PointerEvent) => {
      if (reducedMotionRef.current || isMobileRef.current) return;
      const maxT = maxTRef.current;
      const r = section.getBoundingClientRect();
      if (r.width <= 0) return;
      const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      targetRef.current = maxT === 0 ? centerTRef.current : p * maxT;
    };

    section.addEventListener("pointermove", onSectionPointerMove, {
      passive: true,
      capture: true,
    });
    section.addEventListener("pointerleave", resetToCenter);
    return () => {
      section.removeEventListener("pointermove", onSectionPointerMove, true);
      section.removeEventListener("pointerleave", resetToCenter);
    };
  }, [setHighlight]);

  useEffect(() => {
    const section = document.getElementById("servicios");
    const observer =
      section &&
      new IntersectionObserver(
        ([entry]) => {
          const visible = Boolean(entry?.isIntersecting);
          sectionInViewRef.current = visible;
          if (visible) measureWithRetry();
        },
        { rootMargin: "20% 0px", threshold: 0 },
      );
    if (section && observer) observer.observe(section);

    const loop = () => {
      if (!reducedMotionRef.current && sectionInViewRef.current) {
        const cur = currentRef.current;
        const tgt = targetRef.current;
        let next = cur + (tgt - cur) * 0.038;
        next = Math.abs(tgt - next) < 0.12 ? tgt : next;

        if (isMobileRef.current && cyclePxRef.current > 0) {
          const maxT = maxTRef.current;
          const cyc = cyclePxRef.current;
          const wrapped = wrapTranslate(next, maxT, cyc);
          if (wrapped !== next) {
            const d = wrapped - next;
            targetRef.current += d;
          }
          next = wrapped;
        }

        currentRef.current = next;
        applyTransform(currentRef.current);

        const vp = viewportRef.current;
        const tr = trackRef.current;
        if (vp && tr) {
          const hoverId = hoverIdRef.current;
          if (hoverId) {
            setHighlight(hoverId);
          } else {
            const cells = tr.querySelectorAll<HTMLElement>(
              ".servicios-carousel__cell",
            );
            const cw = cells[0]?.offsetWidth ?? 0;
            if (cw >= 8) {
              const labels = isMobileRef.current
                ? [...ORDER_MOBILE, ...ORDER_MOBILE, ...ORDER_MOBILE]
                : [...ORDER_DESKTOP];
              syncHighlightFromTranslate(currentRef.current, cw, labels);
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const onMvScroll = () => {
      if (!sectionInViewRef.current) return;
      measureWithRetry();
    };
    window.addEventListener("mv-scroll", onMvScroll);

    return () => {
      observer?.disconnect();
      window.removeEventListener("mv-scroll", onMvScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [applyTransform, measureWithRetry, setHighlight, syncHighlightFromTranslate]);

  const DRAG_THRESHOLD_PX = 12;

  const endMobileDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = mobileDragRef.current;
      if (d.pointerId !== e.pointerId) return;
      if (d.active && viewportRef.current) {
        try {
          viewportRef.current.releasePointerCapture(e.pointerId);
        } catch {
          /* ya liberado */
        }
      }
      mobileDragRef.current = {
        pointerId: null,
        startX: 0,
        startTarget: 0,
        active: false,
      };
    },
    [],
  );

  const onViewportPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobileRef.current || reducedMotionRef.current) return;
    mobileDragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startTarget: targetRef.current,
      active: false,
    };
  };

  const onViewportPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMobileRef.current || reducedMotionRef.current) return;
    const d = mobileDragRef.current;
    if (d.pointerId !== e.pointerId) return;
    const vp = viewportRef.current;
    if (!vp) return;
    const dx = e.clientX - d.startX;
    if (!d.active) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      d.active = true;
      vp.setPointerCapture(e.pointerId);
    }
    const maxT = maxTRef.current;
    let next = d.startTarget + dx;
    next = Math.max(maxT, Math.min(0, next));
    targetRef.current = next;
  };

  const onViewportPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    endMobileDrag(e);
  };

  const onViewportPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    endMobileDrag(e);
  };

  const trackLabels = isMobile
    ? [...ORDER_MOBILE, ...ORDER_MOBILE, ...ORDER_MOBILE]
    : [...ORDER_DESKTOP];

  return (
    <div
      ref={rootRef}
      className="servicios-carousel"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Cuidado integral destacado"
    >
      <div className="servicios-carousel__photo-panel" aria-hidden={true}>
        {ORDER_MOBILE.map((label) => (
          <div
            key={label}
            className={
              "servicios-carousel__photo-layer" +
              (highlightedId === label ? " is-active" : "")
            }
          >
            <Image
              src={SERVICE_IMAGES[label]}
              alt=""
              fill
              className="servicios-carousel__photo-img"
              sizes="(max-width: 900px) min(92vw, 572px), min(960px, 96vw)"
              quality={75}
              priority={label === "Grooming"}
            />
          </div>
        ))}
      </div>

      <div
        ref={viewportRef}
        className="servicios-carousel__viewport"
        onPointerDown={onViewportPointerDown}
        onPointerMove={onViewportPointerMove}
        onPointerUp={onViewportPointerUp}
        onPointerCancel={onViewportPointerCancel}
        onPointerLeave={endMobileDrag}
      >
        <div ref={trackRef} className="servicios-carousel__track">
          {trackLabels.map((label, idx) => (
            <div
              key={isMobile ? `m-${idx}-${label}` : `d-${label}`}
              className="servicios-carousel__cell"
            >
              <Link
                href={`/servicios/${servicioSlugFromLabel(label) ?? ""}`}
                className="servicios-carousel__orb"
                aria-label={`${label}. ${SERVICE_SUBTITLES[label]}`}
                onPointerEnter={() => {
                  hoverIdRef.current = label;
                  setHighlight(label);
                }}
                onPointerLeave={() => {
                  if (hoverIdRef.current !== label) return;
                  hoverIdRef.current = null;
                  const vp = viewportRef.current;
                  const tr = trackRef.current;
                  if (!vp || !tr) return;
                  const cells = tr.querySelectorAll<HTMLElement>(
                    ".servicios-carousel__cell",
                  );
                  const cw = cells[0]?.offsetWidth ?? 0;
                  if (cw < 8) return;
                  const labels = isMobileRef.current
                    ? [...ORDER_MOBILE, ...ORDER_MOBILE, ...ORDER_MOBILE]
                    : [...ORDER_DESKTOP];
                  syncHighlightFromTranslate(
                    currentRef.current,
                    cw,
                    labels,
                  );
                }}
                onFocus={() => {
                  hoverIdRef.current = label;
                  setHighlight(label);
                }}
                onBlur={() => {
                  if (hoverIdRef.current !== label) return;
                  hoverIdRef.current = null;
                }}
                onClick={(event) => {
                  if (mobileDragRef.current.active) {
                    event.preventDefault();
                  }
                }}
              >
                <svg
                  className="servicios-carousel__ring"
                  viewBox="0 0 100 100"
                  aria-hidden={true}
                >
                  <circle
                    className="servicios-carousel__ring-path"
                    cx="50"
                    cy="50"
                    r="50"
                  />
                </svg>
                <span className="servicios-carousel__badge" aria-hidden={true}>
                  <span className="servicios-carousel__badge-disc" />
                  <svg
                    className="servicios-carousel__plus"
                    viewBox="0 0 30 30"
                    xmlns="http://www.w3.org/2000/svg"
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
                </span>
                <span className="servicios-carousel__orb-text">
                  <span className="servicios-carousel__label mob-link--wave">
                    <WaveText
                      text={label}
                      screenReaderDuplicate={false}
                      charStaggerMs={14}
                    />
                  </span>
                  <span className="servicios-carousel__subtitle">
                    {SERVICE_SUBTITLES[label]}
                  </span>
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
