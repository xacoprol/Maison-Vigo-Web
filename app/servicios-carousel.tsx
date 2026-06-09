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
const NARROW_MQ = "(max-width: 680px)";

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
/** Copias del track en móvil para scroll infinito (izq / centro / der). */
const MOBILE_LOOP_SETS = 3;

function mobileTrackLabels(): ServiceId[] {
  return Array.from({ length: MOBILE_LOOP_SETS }, () => [...ORDER_MOBILE]).flat();
}

/** Índice inicial: Grooming en la copia central. */
function mobileGroomingLoopIndex(): number {
  return N;
}

function normalizeMobileIndex(index: number): number {
  return ((index % N) + N) % N;
}

function indexFromTranslate(
  translate: number,
  cellW: number,
  centerX: number,
): number {
  return Math.round((centerX - translate - cellW / 2) / cellW);
}

function translateForIndex(
  index: number,
  cellW: number,
  centerX: number,
): number {
  return centerX - (index * cellW + cellW / 2);
}

/** Salta a la copia central equivalente sin animación (scroll infinito). */
function repositionMobileLoop(
  translate: number,
  cellW: number,
  centerX: number,
): number {
  const idx = indexFromTranslate(translate, cellW, centerX);
  if (idx < N) return translate + N * cellW;
  if (idx >= N * 2) return translate - N * cellW;
  return translate;
}

function snapTranslateMobile(
  translate: number,
  cellW: number,
  centerX: number,
): { translate: number; index: number } {
  let bestIdx = N;
  let bestDist = Infinity;
  let bestTranslate = translate;

  for (let i = N; i < N * 2; i += 1) {
    const snapTranslate = translateForIndex(i, cellW, centerX);
    const dist = Math.abs(snapTranslate - translate);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
      bestTranslate = snapTranslate;
    }
  }

  return { translate: bestTranslate, index: bestIdx };
}

function mobileTranslateFromIndex(
  loopIndex: number,
  cellW: number,
  centerX: number,
): number {
  const idx = N + normalizeMobileIndex(loopIndex);
  return translateForIndex(idx, cellW, centerX);
}

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

function isServiceId(value: string): value is ServiceId {
  return value in SERVICE_IMAGES;
}

function clampTranslate(x: number, maxT: number): number {
  return Math.max(maxT, Math.min(0, x));
}

/** Paso de resorte amortiguado (~60 fps) para el snap móvil. */
function springStepMobile(
  current: number,
  target: number,
  velocity: number,
  dt = 1 / 60,
): { value: number; velocity: number } {
  const stiffness = 175;
  const damping = 24;
  const accel = (target - current) * stiffness - velocity * damping;
  const nextVelocity = velocity + accel * dt;
  const nextValue = current + nextVelocity * dt;
  if (Math.abs(target - nextValue) < 0.35 && Math.abs(nextVelocity) < 0.12) {
    return { value: target, velocity: 0 };
  }
  return { value: nextValue, velocity: nextVelocity };
}

/** Centro del área de contenido del viewport (coords. del track). */
function viewportContentCenterX(vp: HTMLElement): number {
  const cs = window.getComputedStyle(vp);
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  return (vp.clientWidth - padL - padR) / 2;
}

function trackLabelsFor(mobile: boolean): readonly ServiceId[] {
  return mobile ? mobileTrackLabels() : ORDER_DESKTOP;
}

/** En móvil estrecho, títulos de dos palabras en dos líneas dentro del orbe. */
const LABEL_LINES: Partial<Record<ServiceId, readonly string[]>> = {
  "Guardería Familiar": ["Guardería", "Familiar"],
};

function ServiceOrbLabel({ label }: { label: ServiceId }) {
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

export function ServiciosCarousel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const maxTRef = useRef(0);
  const centerTRef = useRef(0);
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
  /** Evita navegar al soltar un arrastre horizontal sobre un orbe. */
  const mobileDragMovedRef = useRef(false);
  /** Velocidad del resorte móvil (px/s aprox.) tras soltar. */
  const mobileSpringVelRef = useRef(0);
  /** Foto visible: solo cambia cuando el slide queda asentado. */
  const [photoId, setPhotoId] = useState<ServiceId>("Grooming");
  const photoIdRef = useRef<ServiceId>("Grooming");
  /** Índice lógico del slide activo (0..N-1) en el bloque central. */
  const mobileSlideIndexRef = useRef(0);
  const mobileCellWRef = useRef(0);
  const mobileAnimatingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const lastMobileLayoutRef = useRef<boolean | null>(null);
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

  const clearMobileOrbDepth = useCallback(() => {
    const tr = trackRef.current;
    if (!tr) return;
    tr.querySelectorAll<HTMLElement>(".servicios-carousel__cell").forEach((cell) => {
      cell.style.transform = "";
      cell.style.opacity = "";
    });
  }, []);

  /** Escala/opacidad según distancia al centro (solo móvil). */
  const updateMobileOrbDepth = useCallback((translateX: number, cellW: number) => {
    if (!isMobileRef.current) return;
    const vp = viewportRef.current;
    const tr = trackRef.current;
    if (!vp || !tr || cellW < 8) return;

    const centerX = viewportContentCenterX(vp);
    tr.querySelectorAll<HTMLElement>(".servicios-carousel__cell").forEach((cell, i) => {
      const cellCenter = i * cellW + cellW / 2 + translateX;
      const dist = Math.abs(cellCenter - centerX);
      const norm = Math.min(1, dist / (cellW * 0.9));
      const scale = 1 - norm * 0.12;
      const opacity = 1 - norm * 0.34;
      cell.style.transform = `scale(${scale})`;
      cell.style.opacity = `${opacity}`;
    });
  }, []);

  const setHighlight = useCallback((id: ServiceId) => {
    if (highlightedIdRef.current === id) return;
    highlightedIdRef.current = id;
    setHighlightedId(id);
  }, []);

  const commitPhoto = useCallback((id: ServiceId) => {
    if (photoIdRef.current === id) return;
    photoIdRef.current = id;
    setPhotoId(id);
  }, []);

  const commitPhotoFromLoopIndex = useCallback(
    (loopIndex: number) => {
      const label = ORDER_MOBILE[normalizeMobileIndex(loopIndex)];
      if (label) commitPhoto(label);
    },
    [commitPhoto],
  );

  const applyMobileLoopReposition = useCallback(
    (translate: number, cellW: number, centerX: number): number => {
      if (!isMobileRef.current) return translate;
      const next = repositionMobileLoop(translate, cellW, centerX);
      if (next !== translate) {
        currentRef.current = next;
        targetRef.current = next;
        mobileSlideIndexRef.current = normalizeMobileIndex(
          indexFromTranslate(next, cellW, centerX),
        );
      }
      return next;
    },
    [],
  );

  const isMobileInteractionLocked = useCallback(() => {
    return (
      mobileDragRef.current.active ||
      mobileAnimatingRef.current ||
      Math.abs(mobileSpringVelRef.current) > 0.25
    );
  }, []);

  /** Orbe activo según proximidad al centro (móvil: actualiza en tiempo real). */
  const syncHighlightFromTranslate = useCallback(
    (translateX: number, cellW: number, labels: readonly string[]) => {
      const vp = viewportRef.current;
      if (!vp || cellW < 8 || labels.length === 0) return;

      const centerX = viewportContentCenterX(vp);
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
      const label = isMobileRef.current
        ? ORDER_MOBILE[normalizeMobileIndex(bestIdx)]
        : labels[bestIdx];
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

    const cells = tr.querySelectorAll<HTMLElement>(".servicios-carousel__cell");
    if (cells.length === 0) return false;

    /** Esperar al DOM acorde al breakpoint (evita init con 5 celdas SSR en móvil). */
    const expectedCellCount = mobile
      ? N * MOBILE_LOOP_SETS
      : ORDER_DESKTOP.length;
    if (cells.length !== expectedCellCount) return false;

    if (mobile && isMobileInteractionLocked()) return true;

    const cs = window.getComputedStyle(vp);
    const padX =
      (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const vw = Math.max(0, vp.clientWidth - padX);

    const narrowMobile =
      mobile && window.matchMedia(NARROW_MQ).matches;
    const cellW = mobile
      ? vw / (narrowMobile ? 2.15 : 2.5)
      : vw / 4;
    cells.forEach((cell) => {
      cell.style.flex = `0 0 ${cellW}px`;
      cell.style.width = `${cellW}px`;
      if (!mobile) {
        cell.style.transform = "";
        cell.style.opacity = "";
      }
    });

    const cw = cellW;
    if (cw < 8 || vw < 8) return false;
    if (mobile) mobileCellWRef.current = cw;

    if (mobile) {
      const padT = parseFloat(cs.paddingTop) || 0;
      const padB = parseFloat(cs.paddingBottom) || 0;
      vp.style.minHeight = `${cw + padT + padB}px`;
    } else {
      vp.style.minHeight = "";
    }

    const tw = cw * cells.length;
    const maxT = mobile ? 0 : Math.min(0, vw - tw);
    maxTRef.current = maxT;

    let centerX: number;
    if (mobile) {
      const contentCenter = viewportContentCenterX(vp);
      centerX = translateForIndex(mobileGroomingLoopIndex(), cw, contentCenter);
    } else {
      /** Centrar el bloque de 5: se ven 4 celdas de ancho (½ + 3 + ½) */
      const trackCenterPx = (N * cw) / 2;
      centerX = vw / 2 - trackCenterPx;
      centerX = Math.max(maxT, Math.min(0, centerX));
    }

    centerTRef.current = centerX;

    const layoutChanged = lastMobileLayoutRef.current !== mobile;
    const shouldReset =
      !hasInitializedRef.current || layoutChanged || reducedMotionRef.current;
    const prevTarget = targetRef.current;

    let nextTranslate = centerX;
    if (!shouldReset) {
      if (mobile) {
        const contentCenter = viewportContentCenterX(vp);
        nextTranslate = mobileTranslateFromIndex(
          mobileSlideIndexRef.current,
          cw,
          contentCenter,
        );
      } else {
        nextTranslate = clampTranslate(prevTarget, maxT);
      }
    } else if (mobile) {
      mobileSlideIndexRef.current = 0;
    }

    currentRef.current = nextTranslate;
    targetRef.current = nextTranslate;
    mobileSpringVelRef.current = 0;
    mobileAnimatingRef.current = false;

    applyTransform(nextTranslate);
    syncHighlightFromTranslate(nextTranslate, cw, trackLabelsFor(mobile));
    if (mobile) {
      updateMobileOrbDepth(nextTranslate, cw);
      commitPhotoFromLoopIndex(N + mobileSlideIndexRef.current);
    } else {
      clearMobileOrbDepth();
      commitPhoto(highlightedIdRef.current);
    }

    hasInitializedRef.current = true;
    lastMobileLayoutRef.current = mobile;
    return true;
  }, [
    applyTransform,
    clearMobileOrbDepth,
    commitPhoto,
    commitPhotoFromLoopIndex,
    isMobileInteractionLocked,
    syncHighlightFromTranslate,
    updateMobileOrbDepth,
  ]);

  /** Reintenta hasta que el layout del track tenga medidas reales. */
  const measureWithRetry = useCallback(() => {
    if (measure()) return;
    let attempts = 0;
    const maxAttempts = 64;
    const tick = () => {
      if (measure() || attempts >= maxAttempts) return;
      attempts += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [measure]);

  const safeMeasureWithRetry = useCallback(() => {
    if (isMobileRef.current && isMobileInteractionLocked()) return;
    measureWithRetry();
  }, [isMobileInteractionLocked, measureWithRetry]);

  useLayoutEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const layoutChanged = lastMobileLayoutRef.current !== isMobile;
    if (layoutChanged) {
      hasInitializedRef.current = false;
      mobileSlideIndexRef.current = 0;
    }
    isMobileRef.current = isMobile;
    measureWithRetry();
  }, [isMobile, measureWithRetry]);

  useEffect(() => {
    safeMeasureWithRetry();
    const ro = new ResizeObserver(() => safeMeasureWithRetry());
    const vp = viewportRef.current;
    const tr = trackRef.current;
    if (vp) ro.observe(vp);
    if (tr) ro.observe(tr);
    window.addEventListener("resize", safeMeasureWithRetry);

    const onFontsReady = () => safeMeasureWithRetry();
    document.fonts?.ready.then(onFontsReady);

    const onIntroComplete = () => safeMeasureWithRetry();
    document.body.addEventListener("mv-intro-complete", onIntroComplete);

    const revealLayer = document.querySelector(
      ".servicios-carousel-wrap.reveal",
    );
    const revealObserver =
      revealLayer &&
      new MutationObserver(() => {
        if (revealLayer.classList.contains("visible")) safeMeasureWithRetry();
      });
    if (revealLayer && revealObserver) {
      revealObserver.observe(revealLayer, {
        attributes: true,
        attributeFilter: ["class"],
      });
      if (revealLayer.classList.contains("visible")) safeMeasureWithRetry();
    }

    return () => {
      ro.disconnect();
      revealObserver?.disconnect();
      window.removeEventListener("resize", safeMeasureWithRetry);
      document.body.removeEventListener("mv-intro-complete", onIntroComplete);
    };
  }, [safeMeasureWithRetry]);

  useEffect(() => {
    if (!isMobile) return;
    ORDER_MOBILE.forEach((label) => {
      const img = new window.Image();
      img.src = SERVICE_IMAGES[label];
    });
  }, [isMobile]);

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
          if (visible) safeMeasureWithRetry();
        },
        { rootMargin: "20% 0px", threshold: 0 },
      );
    if (section && observer) observer.observe(section);

    const loop = () => {
      if (!reducedMotionRef.current && sectionInViewRef.current) {
        const dragging = mobileDragRef.current.active;
        const cur = currentRef.current;
        const tgt = targetRef.current;

        let next: number;
        if (dragging) {
          next = tgt;
          currentRef.current = next;
          mobileSpringVelRef.current = 0;
          mobileAnimatingRef.current = false;
        } else if (isMobileRef.current) {
          if (reducedMotionRef.current) {
            next = targetRef.current;
            mobileSpringVelRef.current = 0;
          } else {
            const spring = springStepMobile(
              cur,
              targetRef.current,
              mobileSpringVelRef.current,
            );
            next = spring.value;
            mobileSpringVelRef.current = spring.velocity;
          }
          currentRef.current = next;
          mobileAnimatingRef.current =
            Math.abs(mobileSpringVelRef.current) > 0.25 ||
            Math.abs(next - targetRef.current) > 0.5;

          const vp = viewportRef.current;
          const tr = trackRef.current;
          if (vp && tr) {
            const cells = tr.querySelectorAll<HTMLElement>(".servicios-carousel__cell");
            const cw = cells[0]?.offsetWidth ?? mobileCellWRef.current;
            if (cw >= 8) {
              const centerX = viewportContentCenterX(vp);
              const loopIdx = indexFromTranslate(next, cw, centerX);
              if (loopIdx < N || loopIdx >= N * 2) {
                const reposed = applyMobileLoopReposition(next, cw, centerX);
                if (reposed !== next) {
                  next = reposed;
                  currentRef.current = reposed;
                  applyTransform(reposed);
                }
              }

              const settled =
                !mobileAnimatingRef.current &&
                Math.abs(next - targetRef.current) < 0.5;
              if (settled) {
                mobileSlideIndexRef.current = normalizeMobileIndex(
                  indexFromTranslate(currentRef.current, cw, centerX),
                );
                commitPhotoFromLoopIndex(
                  N + mobileSlideIndexRef.current,
                );
              }
            }
          }
        } else {
          const ease = 0.038;
          next = cur + (tgt - cur) * ease;
          next = Math.abs(tgt - next) < 0.35 ? tgt : next;
          currentRef.current = next;
        }

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
              syncHighlightFromTranslate(
                currentRef.current,
                cw,
                trackLabelsFor(isMobileRef.current),
              );
              if (isMobileRef.current) {
                updateMobileOrbDepth(currentRef.current, cw);
              }
            }
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
  }, [
    applyTransform,
    applyMobileLoopReposition,
    commitPhotoFromLoopIndex,
    safeMeasureWithRetry,
    setHighlight,
    syncHighlightFromTranslate,
    updateMobileOrbDepth,
  ]);

  const DRAG_THRESHOLD_PX = 4;

  const setDraggingUi = useCallback((active: boolean) => {
    rootRef.current?.classList.toggle("is-dragging", active);
  }, []);

  const snapMobileToNearest = useCallback(() => {
    if (!isMobileRef.current || reducedMotionRef.current) return;
    const tr = trackRef.current;
    const vp = viewportRef.current;
    if (!tr || !vp) return;

    const cells = tr.querySelectorAll<HTMLElement>(".servicios-carousel__cell");
    const cw = cells[0]?.offsetWidth ?? 0;
    if (cw < 8) return;

    const centerX = viewportContentCenterX(vp);
    const { translate, index } = snapTranslateMobile(
      targetRef.current,
      cw,
      centerX,
    );

    targetRef.current = translate;
    currentRef.current = translate;
    mobileSlideIndexRef.current = normalizeMobileIndex(index);
    const label = ORDER_MOBILE[normalizeMobileIndex(index)];
    if (label) setHighlight(label);
  }, [setHighlight]);

  const applyMobileDrag = useCallback(
    (dx: number) => {
      const tr = trackRef.current;
      const vp = viewportRef.current;
      if (!tr || !vp) return;

      const cells = tr.querySelectorAll<HTMLElement>(".servicios-carousel__cell");
      const cw = cells[0]?.offsetWidth ?? 0;
      if (cw < 8) return;

      const centerX = viewportContentCenterX(vp);
      const startTarget = mobileDragRef.current.startTarget;
      let next = startTarget + dx;
      const idx = indexFromTranslate(next, cw, centerX);
      if (idx < N) {
        next += N * cw;
        mobileDragRef.current.startTarget += N * cw;
      } else if (idx >= N * 2) {
        next -= N * cw;
        mobileDragRef.current.startTarget -= N * cw;
      }

      targetRef.current = next;
      currentRef.current = next;
      mobileSlideIndexRef.current = normalizeMobileIndex(
        indexFromTranslate(next, cw, centerX),
      );
      applyTransform(next);
      syncHighlightFromTranslate(next, cw, trackLabelsFor(true));
      updateMobileOrbDepth(next, cw);
    },
    [applyTransform, syncHighlightFromTranslate, updateMobileOrbDepth],
  );

  const finishMobileDrag = useCallback(
    (velocityX = 0) => {
      if (mobileDragRef.current.active) {
        const tr = trackRef.current;
        const vp = viewportRef.current;
        let releaseX = targetRef.current;

        if (tr && vp) {
          const cells = tr.querySelectorAll<HTMLElement>(".servicios-carousel__cell");
          const cw = cells[0]?.offsetWidth ?? 0;
          if (cw >= 8) {
            const centerX = viewportContentCenterX(vp);
            releaseX = repositionMobileLoop(releaseX, cw, centerX);
            const flingPx = velocityX * 360;
            const projected = releaseX + flingPx;
            const { translate, index } = snapTranslateMobile(
              projected,
              cw,
              centerX,
            );
            releaseX = translate;
            mobileSlideIndexRef.current = normalizeMobileIndex(index);
            const label = ORDER_MOBILE[mobileSlideIndexRef.current];
            if (label) setHighlight(label);
          } else {
            snapMobileToNearest();
          }
        } else {
          snapMobileToNearest();
        }

        targetRef.current = releaseX;
        if (!reducedMotionRef.current) {
          mobileSpringVelRef.current = velocityX * 680;
          mobileAnimatingRef.current = true;
        } else {
          mobileSpringVelRef.current = 0;
          mobileAnimatingRef.current = false;
          currentRef.current = releaseX;
          applyTransform(releaseX);
          commitPhotoFromLoopIndex(N + mobileSlideIndexRef.current);
        }
      }
      setDraggingUi(false);
      mobileDragRef.current = {
        pointerId: null,
        startX: 0,
        startTarget: 0,
        active: false,
      };
      window.setTimeout(() => {
        mobileDragMovedRef.current = false;
        safeMeasureWithRetry();
      }, 0);
    },
    [setDraggingUi, setHighlight, snapMobileToNearest, commitPhotoFromLoopIndex, safeMeasureWithRetry],
  );

  const lenisPausedForDragRef = useRef(false);

  const pauseLenisForDrag = useCallback(() => {
    if (lenisPausedForDragRef.current) return;
    window.__mvLenis?.stop();
    lenisPausedForDragRef.current = true;
  }, []);

  const resumeLenisAfterDrag = useCallback(() => {
    if (!lenisPausedForDragRef.current) return;
    window.__mvLenis?.start();
    lenisPausedForDragRef.current = false;
  }, []);

  /** Móvil: pointer nativo en capture (antes que Lenis) + pausa smooth scroll al arrastrar. */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const drag = {
      pointerId: -1,
      startX: 0,
      startY: 0,
      startTarget: 0,
      axis: null as "x" | "y" | null,
      lastX: 0,
      lastTime: 0,
      velocityX: 0,
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!isMobileRef.current || reducedMotionRef.current) return;
      if (e.button !== 0) return;
      if (!vp.contains(e.target as Node)) return;

      pauseLenisForDrag();

      let startTarget = currentRef.current;
      const tr = trackRef.current;
      const cw = mobileCellWRef.current;
      if (tr && cw >= 8) {
        const centerX = viewportContentCenterX(vp);
        startTarget = repositionMobileLoop(startTarget, cw, centerX);
        currentRef.current = startTarget;
        targetRef.current = startTarget;
      }

      drag.pointerId = e.pointerId;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
      drag.startTarget = startTarget;
      drag.axis = null;
      drag.lastX = e.clientX;
      drag.lastTime = performance.now();
      drag.velocityX = 0;
      mobileSpringVelRef.current = 0;
      mobileAnimatingRef.current = false;
      mobileDragMovedRef.current = false;
      setDraggingUi(false);
      mobileDragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startTarget,
        active: false,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isMobileRef.current || drag.pointerId !== e.pointerId) return;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const now = performance.now();
      const dt = now - drag.lastTime;
      if (dt > 0 && dt < 100) {
        const instantV = (e.clientX - drag.lastX) / dt;
        drag.velocityX = drag.velocityX * 0.38 + instantV * 0.62;
      }
      drag.lastX = e.clientX;
      drag.lastTime = now;

      if (!drag.axis) {
        if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) {
          return;
        }
        /** En el carrusel priorizamos horizontal salvo gesto claramente vertical. */
        drag.axis = Math.abs(dy) > Math.abs(dx) * 1.35 ? "y" : "x";
        if (drag.axis === "y") {
          resumeLenisAfterDrag();
          drag.pointerId = -1;
          return;
        }
        if (drag.axis === "x") {
          try {
            vp.setPointerCapture(e.pointerId);
          } catch {
            /* noop */
          }
        }
      }

      if (drag.axis === "y") return;

      e.preventDefault();
      mobileDragRef.current.active = true;
      mobileDragMovedRef.current = true;
      setDraggingUi(true);
      applyMobileDrag(dx);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (drag.pointerId !== e.pointerId) return;
      const velocityX = drag.velocityX;
      try {
        vp.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      drag.pointerId = -1;
      drag.axis = null;
      drag.velocityX = 0;
      finishMobileDrag(velocityX);
      resumeLenisAfterDrag();
    };

    vp.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
    vp.addEventListener("pointermove", onPointerMove, { capture: true, passive: false });
    vp.addEventListener("pointerup", onPointerUp, { capture: true, passive: true });
    vp.addEventListener("pointercancel", onPointerUp, { capture: true, passive: true });

    return () => {
      vp.removeEventListener("pointerdown", onPointerDown, true);
      vp.removeEventListener("pointermove", onPointerMove, true);
      vp.removeEventListener("pointerup", onPointerUp, true);
      vp.removeEventListener("pointercancel", onPointerUp, true);
      setDraggingUi(false);
      resumeLenisAfterDrag();
    };
  }, [
    applyMobileDrag,
    finishMobileDrag,
    pauseLenisForDrag,
    resumeLenisAfterDrag,
    setDraggingUi,
  ]);

  const trackLabels = trackLabelsFor(isMobile);
  const activePhotoId = isMobile ? photoId : highlightedId;

  return (
    <div
      ref={rootRef}
      className="servicios-carousel"
      data-lenis-prevent-touch=""
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
              (activePhotoId === label ? " is-active" : "")
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

      <div
        ref={viewportRef}
        className="servicios-carousel__viewport"
      >
        <div ref={trackRef} className="servicios-carousel__track">
          {trackLabels.map((label, loopIndex) => (
            <div
              key={isMobile ? `m-${loopIndex}-${label}` : `d-${label}`}
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
                  const vp = viewportRef.current;
                  const tr = trackRef.current;
                  if (!vp || !tr) return;
                  const cells = tr.querySelectorAll<HTMLElement>(
                    ".servicios-carousel__cell",
                  );
                  const cw = cells[0]?.offsetWidth ?? 0;
                  if (cw < 8) return;
                  syncHighlightFromTranslate(
                    currentRef.current,
                    cw,
                    trackLabelsFor(isMobileRef.current),
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
                  if (mobileDragMovedRef.current || mobileDragRef.current.active) {
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
