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

import { ServiciosCarouselMobile } from "./servicios-carousel-mobile";
import {
  ORDER_DESKTOP,
  ORDER_MOBILE,
  SERVICE_IMAGES,
  SERVICE_SUBTITLES,
  ServiceOrbLabel,
  type ServiceId,
} from "./servicios-carousel-shared";

const N = ORDER_DESKTOP.length;

const subscribeMobileMq = (onStoreChange: () => void) => {
  const mq = window.matchMedia("(max-width: 900px)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
};

const getMobileMqSnapshot = () => window.matchMedia("(max-width: 900px)").matches;
const getMobileMqServerSnapshot = () => false;

function isServiceId(value: string): value is ServiceId {
  return value in SERVICE_IMAGES;
}

function clampTranslate(x: number, maxT: number): number {
  return Math.max(maxT, Math.min(0, x));
}

function viewportContentCenterX(vp: HTMLElement): number {
  const cs = window.getComputedStyle(vp);
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  return (vp.clientWidth - padL - padR) / 2;
}

function cellCenterAt(
  index: number,
  cellW: number,
  translate: number,
): number {
  return index * cellW + cellW / 2 + translate;
}

function ServiciosCarouselDesktop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const maxTRef = useRef(0);
  const centerTRef = useRef(0);
  const rafRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const sectionInViewRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const [highlightedId, setHighlightedId] = useState<ServiceId>("Grooming");
  const highlightedIdRef = useRef<ServiceId>("Grooming");
  const hoverIdRef = useRef<ServiceId | null>(null);

  const applyTransform = useCallback((x: number) => {
    const tr = trackRef.current;
    if (tr) tr.style.transform = `translate3d(${x}px,0,0)`;
  }, []);

  const setHighlight = useCallback((id: ServiceId) => {
    if (highlightedIdRef.current === id) return;
    highlightedIdRef.current = id;
    setHighlightedId(id);
  }, []);

  const syncHighlightFromTranslate = useCallback(
    (translateX: number, cellW: number) => {
      const vp = viewportRef.current;
      if (!vp || cellW < 8) return;

      const centerX = viewportContentCenterX(vp);
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < ORDER_DESKTOP.length; i++) {
        const cellCenter = cellCenterAt(i, cellW, translateX);
        const dist = Math.abs(cellCenter - centerX);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      const label = ORDER_DESKTOP[bestIdx];
      if (isServiceId(label)) setHighlight(label);
    },
    [setHighlight],
  );

  const measure = useCallback((): boolean => {
    const vp = viewportRef.current;
    const tr = trackRef.current;
    if (!vp || !tr) return false;

    const cells = tr.querySelectorAll<HTMLElement>(".servicios-carousel__cell");
    if (cells.length !== ORDER_DESKTOP.length) return false;

    const cs = window.getComputedStyle(vp);
    const padX =
      (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const vw = Math.max(0, vp.clientWidth - padX);
    const cellW = vw / 4;

    cells.forEach((cell) => {
      cell.style.flex = `0 0 ${cellW}px`;
      cell.style.width = `${cellW}px`;
      cell.style.marginLeft = "";
      cell.style.transform = "";
      cell.style.opacity = "";
    });

    if (cellW < 8 || vw < 8) return false;

    vp.style.minHeight = "";

    const tw = cellW * cells.length;
    const maxT = Math.min(0, vw - tw);
    maxTRef.current = maxT;

    const trackCenterPx = (N * cellW) / 2;
    let centerX = vw / 2 - trackCenterPx;
    centerX = Math.max(maxT, Math.min(0, centerX));
    centerTRef.current = centerX;

    const shouldReset = !hasInitializedRef.current || reducedMotionRef.current;
    const nextTranslate = shouldReset
      ? centerX
      : clampTranslate(targetRef.current, maxT);

    currentRef.current = nextTranslate;
    targetRef.current = nextTranslate;
    applyTransform(nextTranslate);
    syncHighlightFromTranslate(nextTranslate, cellW);
    hasInitializedRef.current = true;
    return true;
  }, [applyTransform, syncHighlightFromTranslate]);

  const measureWithRetry = useCallback(() => {
    if (measure()) return;
    let attempts = 0;
    const tick = () => {
      if (measure() || attempts >= 64) return;
      attempts += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [measure]);

  useLayoutEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    measureWithRetry();
  }, [measureWithRetry]);

  useEffect(() => {
    measureWithRetry();
    const ro = new ResizeObserver(measureWithRetry);
    const vp = viewportRef.current;
    const tr = trackRef.current;
    if (vp) ro.observe(vp);
    if (tr) ro.observe(tr);
    window.addEventListener("resize", measureWithRetry);
    document.fonts?.ready.then(measureWithRetry);

    const onIntroComplete = () => measureWithRetry();
    document.body.addEventListener("mv-intro-complete", onIntroComplete);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureWithRetry);
      document.body.removeEventListener("mv-intro-complete", onIntroComplete);
    };
  }, [measureWithRetry]);

  useEffect(() => {
    const section = document.getElementById("servicios");
    if (!section) return;

    const resetToCenter = () => {
      if (reducedMotionRef.current) return;
      hoverIdRef.current = null;
      targetRef.current = centerTRef.current;
      setHighlight("Grooming");
    };

    const onSectionPointerMove = (e: PointerEvent) => {
      if (reducedMotionRef.current) return;
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
          sectionInViewRef.current = Boolean(entry?.isIntersecting);
          if (entry?.isIntersecting) measureWithRetry();
        },
        { rootMargin: "20% 0px", threshold: 0 },
      );
    if (section && observer) observer.observe(section);

    const loop = () => {
      if (!reducedMotionRef.current && sectionInViewRef.current) {
        const cur = currentRef.current;
        const tgt = targetRef.current;
        const ease = 0.038;
        let next = cur + (tgt - cur) * ease;
        next = Math.abs(tgt - next) < 0.35 ? tgt : next;
        currentRef.current = next;
        applyTransform(next);

        const vp = viewportRef.current;
        const tr = trackRef.current;
        if (vp && tr) {
          if (hoverIdRef.current) {
            setHighlight(hoverIdRef.current);
          } else {
            const cw =
              tr.querySelector<HTMLElement>(".servicios-carousel__cell")
                ?.offsetWidth ?? 0;
            if (cw >= 8) syncHighlightFromTranslate(currentRef.current, cw);
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [applyTransform, measureWithRetry, setHighlight, syncHighlightFromTranslate]);

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
              sizes="(max-width: 900px) min(98vw, 640px), min(1180px, 98vw)"
              quality={75}
              priority={label === "Grooming"}
            />
          </div>
        ))}
      </div>

      <div ref={viewportRef} className="servicios-carousel__viewport">
        <div ref={trackRef} className="servicios-carousel__track">
          {ORDER_DESKTOP.map((label) => (
            <div
              key={label}
              className="servicios-carousel__cell"
              data-service={label}
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
                  const tr = trackRef.current;
                  const cw =
                    tr?.querySelector<HTMLElement>(".servicios-carousel__cell")
                      ?.offsetWidth ?? 0;
                  if (cw >= 8) {
                    syncHighlightFromTranslate(currentRef.current, cw);
                  }
                }}
                onFocus={() => {
                  hoverIdRef.current = label;
                  setHighlight(label);
                }}
                onBlur={() => {
                  if (hoverIdRef.current !== label) return;
                  hoverIdRef.current = null;
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
                  <ServiceOrbLabel label={label} />
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

export function ServiciosCarousel() {
  const isMobile = useSyncExternalStore(
    subscribeMobileMq,
    getMobileMqSnapshot,
    getMobileMqServerSnapshot,
  );

  if (isMobile) return <ServiciosCarouselMobile />;
  return <ServiciosCarouselDesktop />;
}
