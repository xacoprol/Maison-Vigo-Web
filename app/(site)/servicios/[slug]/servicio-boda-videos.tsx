"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { WaveText } from "@/app/wave-text";
import { ACOMPANAMIENTO_INQUIRY_OPEN_EVENT } from "@/lib/care-assist";
import { useTitleReveal } from "@/lib/use-title-reveal";

import "./servicio-boda-videos.css";

type BodaVideo = {
  src: string;
  label: string;
};

const VIDEOS: BodaVideo[] = [
  {
    src: "/assets/videos/acompanamiento/boda-1.webm",
    label: "Cuidado en el evento",
  },
  {
    src: "/assets/videos/acompanamiento/boda-2.webm",
    label: "Presencia en el día",
  },
  {
    src: "/assets/videos/acompanamiento/boda-3.webm",
    label: "Calma y vínculo",
  },
  {
    src: "/assets/videos/acompanamiento/boda-4.webm",
    label: "Momentos juntos",
  },
];

/** Distancia circular; visibles solo −1 / 0 / 1. */
function slotFor(index: number, active: number, total: number) {
  let d = index - active;
  if (d > total / 2) d -= total;
  if (d < -total / 2) d += total;
  return d;
}

export function ServicioBodaVideos() {
  const [active, setActive] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const swipeLockRef = useRef<"h" | "v" | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);
  const soundOnRef = useRef(false);
  const { ref: titleRef, displayClassName: titleDisplayClass } =
    useTitleReveal();

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  const syncPlayback = useCallback((index: number) => {
    const wantSound = soundOnRef.current;
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === index) {
        video.muted = !wantSound;
        void video.play().catch(() => {
          /* Autoplay con audio puede fallar: quedamos en mute. */
          if (wantSound) {
            video.muted = true;
            soundOnRef.current = false;
            setSoundOn(false);
            void video.play().catch(() => {});
          }
        });
      } else {
        video.muted = true;
        video.pause();
        try {
          video.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
    });
  }, []);

  useEffect(() => {
    syncPlayback(active);
  }, [active, syncPlayback]);

  useEffect(() => {
    const video = videoRefs.current[active];
    if (!video) return;
    video.muted = !soundOn;
    if (soundOn) {
      void video.play().catch(() => {
        video.muted = true;
        setSoundOn(false);
      });
    }
  }, [soundOn, active]);

  useEffect(() => {
    const root = document.getElementById("servicio-boda-videos");
    if (!root) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) syncPlayback(active);
        else {
          videoRefs.current.forEach((v) => {
            if (!v) return;
            v.pause();
            v.muted = true;
          });
          if (soundOnRef.current) setSoundOn(false);
        }
      },
      { threshold: 0.35 },
    );
    obs.observe(root);
    return () => obs.disconnect();
  }, [active, syncPlayback]);

  const prev = useCallback(
    () => setActive((i) => (i + VIDEOS.length - 1) % VIDEOS.length),
    [],
  );
  const next = useCallback(
    () => setActive((i) => (i + 1) % VIDEOS.length),
    [],
  );

  useEffect(() => {
    const wrap = stageWrapRef.current;
    if (!wrap) return;

    const isChromeControl = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(
        target.closest(
          ".servicio-boda-videos__arrow, .servicio-boda-videos__sound",
        ),
      );

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || isChromeControl(e.target)) {
        touchStartRef.current = null;
        swipeLockRef.current = null;
        return;
      }
      touchStartRef.current = {
        x: e.touches[0]!.clientX,
        y: e.touches[0]!.clientY,
      };
      swipeLockRef.current = null;
      swipedRef.current = false;
    };

    const onMove = (e: TouchEvent) => {
      const start = touchStartRef.current;
      if (!start || e.touches.length !== 1) return;
      const dx = e.touches[0]!.clientX - start.x;
      const dy = e.touches[0]!.clientY - start.y;
      if (!swipeLockRef.current) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        swipeLockRef.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      }
      if (swipeLockRef.current === "h") {
        e.preventDefault();
      }
    };

    const onEnd = (e: TouchEvent) => {
      const start = touchStartRef.current;
      const axis = swipeLockRef.current;
      touchStartRef.current = null;
      swipeLockRef.current = null;
      if (!start || axis === "v" || e.changedTouches.length !== 1) return;
      const t = e.changedTouches[0]!;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) < 36 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
      swipedRef.current = true;
      if (dx < 0) next();
      else prev();
      window.setTimeout(() => {
        swipedRef.current = false;
      }, 280);
    };

    wrap.addEventListener("touchstart", onStart, { passive: true });
    wrap.addEventListener("touchmove", onMove, { passive: false });
    wrap.addEventListener("touchend", onEnd);
    wrap.addEventListener("touchcancel", onEnd);
    return () => {
      wrap.removeEventListener("touchstart", onStart);
      wrap.removeEventListener("touchmove", onMove);
      wrap.removeEventListener("touchend", onEnd);
      wrap.removeEventListener("touchcancel", onEnd);
    };
  }, [next, prev]);

  const openForm = () => {
    document.body.dispatchEvent(new Event(ACOMPANAMIENTO_INQUIRY_OPEN_EVENT));
  };

  const toggleSound = () => {
    setSoundOn((on) => !on);
  };

  const activeLabel = VIDEOS[active]?.label ?? "";
  const indexLabel = `${String(active + 1).padStart(2, "0")} — ${String(VIDEOS.length).padStart(2, "0")}`;

  return (
    <section
      id="servicio-boda-videos"
      className="servicio-boda-videos"
      aria-labelledby="servicio-boda-videos-heading"
    >
      <div className="servicio-boda-videos__inner">
        <header className="servicio-boda-videos__header">
          <p className="servicio-boda-videos__eyebrow">Bodas reales</p>
          <h2
            ref={titleRef}
            id="servicio-boda-videos-heading"
            className={`servicio-boda-videos__title ${titleDisplayClass}`}
          >
            <span className="mv-title-reveal">
              Ellos también forman parte del día
            </span>
          </h2>
          <p className="servicio-boda-videos__lead">
            Presencia serena, cuidado cercano y el vínculo intacto — para que
            podáis vivir el momento juntos.
          </p>
        </header>

        <div ref={stageWrapRef} className="servicio-boda-videos__stage-wrap">
          <button
            type="button"
            className="servicio-boda-videos__arrow servicio-boda-videos__arrow--prev"
            onClick={prev}
            aria-label="Vídeo anterior"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/iconos/arrow-left.svg"
              alt=""
              width={18}
              height={18}
              className="servicio-boda-videos__arrow-icon"
              aria-hidden={true}
            />
          </button>

          <div
            ref={stageRef}
            className="servicio-boda-videos__stage"
            aria-live="polite"
          >
            {VIDEOS.map((item, index) => {
              const slot = slotFor(index, active, VIDEOS.length);
              const isCenter = slot === 0;
              const isVisible = Math.abs(slot) <= 1;
              return (
                <button
                  key={item.src}
                  type="button"
                  className={
                    "servicio-boda-videos__frame" +
                    (isCenter ? " is-center" : "") +
                    (slot === -1 ? " is-left" : "") +
                    (slot === 1 ? " is-right" : "") +
                    (!isVisible ? " is-hidden" : "")
                  }
                  tabIndex={isVisible ? 0 : -1}
                  onClick={() => {
                    if (swipedRef.current) return;
                    if (!isCenter) setActive(index);
                  }}
                  aria-label={item.label}
                  aria-hidden={!isVisible}
                  aria-current={isCenter ? "true" : undefined}
                >
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el;
                    }}
                    className="servicio-boda-videos__video"
                    src={item.src}
                    muted
                    playsInline
                    loop
                    preload={isVisible ? "metadata" : "none"}
                    aria-hidden={true}
                  />
                </button>
              );
            })}

            <button
              type="button"
              className={
                "servicio-boda-videos__sound" + (soundOn ? " is-on" : "")
              }
              onClick={toggleSound}
              aria-pressed={soundOn}
              aria-label={soundOn ? "Silenciar audio" : "Activar audio"}
            >
              {soundOn ? (
                <svg
                  className="servicio-boda-videos__sound-icon"
                  viewBox="0 0 24 24"
                  width={18}
                  height={18}
                  aria-hidden={true}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5 6.5 9H3v6h3.5L11 19V5z" />
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                  <path d="M18.2 5.8a9 9 0 0 1 0 12.4" />
                </svg>
              ) : (
                <svg
                  className="servicio-boda-videos__sound-icon"
                  viewBox="0 0 24 24"
                  width={18}
                  height={18}
                  aria-hidden={true}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 5 6.5 9H3v6h3.5L11 19V5z" />
                  <path d="M16 9.5 21 14.5" />
                  <path d="M21 9.5 16 14.5" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="button"
            className="servicio-boda-videos__arrow servicio-boda-videos__arrow--next"
            onClick={next}
            aria-label="Vídeo siguiente"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/iconos/arrow-right.svg"
              alt=""
              width={18}
              height={18}
              className="servicio-boda-videos__arrow-icon"
              aria-hidden={true}
            />
          </button>
        </div>

        <div className="servicio-boda-videos__meta">
          <p className="servicio-boda-videos__index" aria-hidden={true}>
            {indexLabel}
          </p>
          <p className="servicio-boda-videos__caption">{activeLabel}</p>
        </div>

        <div className="servicio-boda-videos__cta-wrap">
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
