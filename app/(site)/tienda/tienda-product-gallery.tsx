"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";

import { webStoreFileUrl } from "@/lib/web-store/utils";

/** Nivel 0 = normal; 1 = +50%; 2 = +50% sobre el nivel 1 (×2,25). */
const ZOOM_SCALES = [1, 1.5, 2.25] as const;
type ZoomLevel = 0 | 1 | 2;

type Props = {
  photos?: { url: string }[] | null;
  alt: string;
};

type SlideZoomState = {
  slideIndex: number;
  level: ZoomLevel;
  panX: number;
  panY: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function panLimits(size: number, scale: number) {
  if (scale <= 1) return 0;
  return (size * (scale - 1)) / 2;
}

function nextZoomLevel(level: ZoomLevel): ZoomLevel {
  if (level === 0) return 1;
  if (level === 1) return 2;
  return 0;
}

function GalleryNavChevron({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={direction === "prev" ? "M14 6l-6 6 6 6" : "M10 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ZoomablePhotoProps = {
  src: string;
  alt: string;
  level: ZoomLevel;
  panX: number;
  panY: number;
  onTapCycle: () => void;
  onPanChange: (x: number, y: number) => void;
  onSwipe?: (direction: -1 | 1) => void;
};

function ZoomableProductPhoto({
  src,
  alt,
  level,
  panX,
  panY,
  onTapCycle,
  onPanChange,
  onSwipe,
}: ZoomablePhotoProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const pointerRef = useRef({
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    moved: false,
    mode: "idle" as "idle" | "pan" | "swipe",
  });

  const scale = ZOOM_SCALES[level];
  const zoomed = level > 0;

  const clampPan = useCallback(
    (x: number, y: number, zoomLevel: ZoomLevel) => {
      const el = frameRef.current;
      if (!el || zoomLevel === 0) return { x: 0, y: 0 };
      const s = ZOOM_SCALES[zoomLevel];
      const maxX = panLimits(el.clientWidth, s);
      const maxY = panLimits(el.clientHeight, s);
      return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
    },
    [],
  );

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    pointerRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: panX,
      startPanY: panY,
      moved: false,
      mode: "idle",
    };
    if (zoomed) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(false);
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = pointerRef.current;
    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;

    if (!zoomed) {
      if (Math.hypot(dx, dy) > 8) p.moved = true;
      return;
    }

    if (p.mode === "idle" && Math.hypot(dx, dy) > 8) {
      setIsDragging(true);
      if (Math.abs(dx) > Math.abs(dy) * 1.15 && onSwipe) {
        p.mode = "swipe";
      } else {
        p.mode = "pan";
      }
    }

    if (p.mode === "pan") {
      const next = clampPan(p.startPanX + dx, p.startPanY + dy, level);
      onPanChange(next.x, next.y);
    }
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const p = pointerRef.current;
    const dx = e.clientX - p.startX;
    const dy = e.clientY - p.startY;
    const dist = Math.hypot(dx, dy);

    if (!zoomed) {
      if (!p.moved && dist < 12) onTapCycle();
      return;
    }

    if (
      onSwipe &&
      (p.mode === "swipe" ||
        (dist > 48 && Math.abs(dx) > Math.abs(dy) * 1.35))
    ) {
      onSwipe(dx > 0 ? -1 : 1);
    } else if (p.mode === "idle" && dist < 10) {
      onTapCycle();
    }

    setIsDragging(false);
    p.mode = "idle";
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const zoomLabel =
    level === 0
      ? "Ampliar foto"
      : level === 1
        ? "Ampliar un 50% más"
        : "Restaurar tamaño de la foto";

  return (
    <div
      ref={frameRef}
      role="button"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        setIsDragging(false);
        pointerRef.current.mode = "idle";
        pointerRef.current.moved = false;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTapCycle();
        }
      }}
      aria-label={zoomLabel}
      className={
        "tienda-sheet__zoom" +
        (zoomed ? " tienda-sheet__zoom--zoomed" : "") +
        (isDragging ? " is-dragging" : "")
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={
          "tienda-sheet__zoom-img" + (isDragging ? " is-dragging" : "")
        }
        style={{
          transform: `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`,
        }}
      />
    </div>
  );
}

/**
 * Galería tipo Care: foto cuadrada dominante (~85%) + asomo de la siguiente,
 * zoom por pulsación y flechas en desktop.
 */
export function TiendaProductGallery({ photos, alt }: Props) {
  const urls = (photos ?? [])
    .map((photo) => webStoreFileUrl(photo?.url))
    .filter((url): url is string => Boolean(url));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<SlideZoomState | null>(null);
  const multi = urls.length > 1;

  const resetZoom = useCallback(() => setZoom(null), []);

  const syncIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || urls.length <= 1) return;
    const slides = el.querySelectorAll<HTMLElement>("[data-photo-slide]");
    if (!slides.length) return;
    const anchor = el.scrollLeft + el.clientWidth * 0.2;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    slides.forEach((slide, i) => {
      const dist = Math.abs(slide.offsetLeft - anchor);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setIndex((prev) => {
      if (prev !== best) resetZoom();
      return best;
    });
  }, [urls.length, resetZoom]);

  const scrollToSlide = useCallback(
    (next: number, behavior: ScrollBehavior = "smooth") => {
      const el = scrollRef.current;
      if (!el || next < 0 || next >= urls.length) return;
      const slides = el.querySelectorAll<HTMLElement>("[data-photo-slide]");
      const target = slides[next];
      if (!target) return;
      resetZoom();
      el.scrollTo({ left: target.offsetLeft, behavior });
      setIndex(next);
    },
    [urls.length, resetZoom],
  );

  const navigateSlide = useCallback(
    (direction: -1 | 1) => {
      scrollToSlide(index + direction);
    },
    [index, scrollToSlide],
  );

  useLayoutEffect(() => {
    resetZoom();
    setIndex(0);
    const el = scrollRef.current;
    if (el) el.scrollLeft = 0;
    const id = requestAnimationFrame(syncIndex);
    return () => cancelAnimationFrame(id);
  }, [syncIndex, urls.join("|"), resetZoom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !multi) return;
    const onScroll = () => {
      if (zoom != null && zoom.level > 0) return;
      syncIndex();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => syncIndex());
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [multi, syncIndex, zoom]);

  const getSlideZoom = (
    i: number,
  ): Pick<SlideZoomState, "level" | "panX" | "panY"> => {
    if (zoom?.slideIndex === i) {
      return { level: zoom.level, panX: zoom.panX, panY: zoom.panY };
    }
    return { level: 0, panX: 0, panY: 0 };
  };

  const tapCycle = (i: number) => {
    setZoom((prev) => {
      if (prev?.slideIndex === i) {
        const nextLevel = nextZoomLevel(prev.level);
        if (nextLevel === 0) return null;
        return { slideIndex: i, level: nextLevel, panX: 0, panY: 0 };
      }
      return { slideIndex: i, level: 1, panX: 0, panY: 0 };
    });
  };

  const updatePan = (i: number, panX: number, panY: number) => {
    setZoom((prev) => {
      if (prev?.slideIndex !== i || prev.level === 0) return prev;
      return { ...prev, panX, panY };
    });
  };

  if (urls.length === 0) {
    return (
      <div className="tienda-sheet__media tienda-sheet__media--empty" aria-hidden>
        Sin foto
      </div>
    );
  }

  const carouselLocked = zoom != null && zoom.level > 0;
  const slideWidthClass = multi
    ? "tienda-sheet__gallery-slide"
    : "tienda-sheet__gallery-slide tienda-sheet__gallery-slide--solo";

  return (
    <div className="tienda-sheet__media">
      <div
        ref={scrollRef}
        className={
          "tienda-sheet__gallery" +
          (carouselLocked ? " tienda-sheet__gallery--locked" : "") +
          (multi ? "" : " tienda-sheet__gallery--solo")
        }
        aria-roledescription="carrusel"
        aria-label={alt}
      >
        {urls.map((url, i) => {
          const { level, panX, panY } = getSlideZoom(i);
          const allowSwipe = multi && level > 0;
          return (
            <figure
              key={`${url}-${i}`}
              data-photo-slide
              className={
                slideWidthClass +
                (carouselLocked && zoom?.slideIndex !== i ? " is-inert" : "")
              }
            >
              <ZoomableProductPhoto
                src={url}
                alt={i === 0 ? alt : `${alt} ${i + 1}`}
                level={level}
                panX={panX}
                panY={panY}
                onTapCycle={() => tapCycle(i)}
                onPanChange={(x, y) => updatePan(i, x, y)}
                onSwipe={allowSwipe ? navigateSlide : undefined}
              />
            </figure>
          );
        })}
      </div>

      {multi && !carouselLocked ? (
        <>
          <button
            type="button"
            className="tienda-sheet__gallery-nav tienda-sheet__gallery-nav--prev"
            aria-label="Foto anterior"
            disabled={index <= 0}
            onClick={() => navigateSlide(-1)}
          >
            <GalleryNavChevron direction="prev" />
          </button>
          <button
            type="button"
            className="tienda-sheet__gallery-nav tienda-sheet__gallery-nav--next"
            aria-label="Foto siguiente"
            disabled={index >= urls.length - 1}
            onClick={() => navigateSlide(1)}
          >
            <GalleryNavChevron direction="next" />
          </button>
        </>
      ) : null}

      {multi ? (
        <>
          <div
            className="tienda-sheet__gallery-dots"
            role="tablist"
            aria-label="Fotos"
          >
            {urls.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Foto ${i + 1} de ${urls.length}`}
                className={
                  "tienda-sheet__gallery-dot" +
                  (i === index ? " is-active" : "")
                }
                onClick={() => scrollToSlide(i)}
              />
            ))}
          </div>
          <p className="tienda-sheet__gallery-count" aria-live="polite">
            {index + 1} / {urls.length}
          </p>
        </>
      ) : null}
    </div>
  );
}
