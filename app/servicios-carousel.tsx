"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
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
    "Cuidado estético realizado de forma tranquila, precisa y personalizada.",
  Bienestar:
    "Diagnóstico, cosmética y cuidados adaptados a las necesidades de cada perro.",
  "Guardería Familiar":
    "Un entorno reducido, tranquilo y supervisado donde sentirse seguro y acompañado.",
  Acompañamiento:
    "Presencia y cuidado personalizado en momentos donde no puedes estar con ellos.",
  Educación:
    "Trabajo enfocado en convivencia, equilibrio y bienestar emocional.",
};

const N = ORDER_MOBILE.length;

function wrapTranslate(x: number, maxT: number, cycle: number): number {
  let v = x;
  while (v > 0) v -= cycle;
  while (v < maxT) v += cycle;
  return v;
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
  const [isMobile, setIsMobile] = useState(false);

  const applyTransform = useCallback((x: number) => {
    const tr = trackRef.current;
    if (tr) tr.style.transform = `translate3d(${x}px,0,0)`;
  }, []);

  const measure = useCallback(() => {
    const vp = viewportRef.current;
    const tr = trackRef.current;
    if (!vp || !tr) return;
    const mobile = window.matchMedia(MOBILE_MQ).matches;
    isMobileRef.current = mobile;

    const cs = window.getComputedStyle(vp);
    const padX =
      (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const vw = Math.max(0, vp.clientWidth - padX);
    const cells = tr.querySelectorAll<HTMLElement>(".servicios-carousel__cell");
    const cw = cells[0]?.offsetWidth ?? 0;
    const tw = tr.scrollWidth;
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
      return;
    }
    currentRef.current = centerX;
    targetRef.current = centerX;
    applyTransform(centerX);
  }, [applyTransform]);

  useLayoutEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const mq = window.matchMedia(MOBILE_MQ);
    setIsMobile(mq.matches);
    isMobileRef.current = mq.matches;
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const onMq = () => {
      const m = mq.matches;
      setIsMobile(m);
      isMobileRef.current = m;
      requestAnimationFrame(() => measure());
    };
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, [measure]);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    const vp = viewportRef.current;
    const tr = trackRef.current;
    if (vp) ro.observe(vp);
    if (tr) ro.observe(tr);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  useEffect(() => {
    requestAnimationFrame(() => measure());
  }, [isMobile, measure]);

  /** Escritorio: barre el carrusel con la X del puntero en toda la sección #servicios (título + carrusel). */
  useEffect(() => {
    const section = document.getElementById("servicios");
    if (!section) return;

    const resetToCenter = () => {
      if (reducedMotionRef.current || isMobileRef.current) return;
      targetRef.current = centerTRef.current;
      setHighlightedId("Grooming");
    };

    const onSectionPointerMove = (e: PointerEvent) => {
      if (reducedMotionRef.current || isMobileRef.current) return;
      const maxT = maxTRef.current;
      if (maxT === 0) return;
      const r = section.getBoundingClientRect();
      if (r.width <= 0) return;
      const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      targetRef.current = p * maxT;
    };

    section.addEventListener("pointermove", onSectionPointerMove, {
      passive: true,
    });
    section.addEventListener("pointerleave", resetToCenter);
    return () => {
      section.removeEventListener("pointermove", onSectionPointerMove);
      section.removeEventListener("pointerleave", resetToCenter);
    };
  }, []);

  useEffect(() => {
    const section = document.getElementById("servicios");
    const observer =
      section &&
      new IntersectionObserver(
        ([entry]) => {
          sectionInViewRef.current = Boolean(entry?.isIntersecting);
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
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [applyTransform]);

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
                onPointerEnter={() => setHighlightedId(label)}
                onFocus={() => setHighlightedId(label)}
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
