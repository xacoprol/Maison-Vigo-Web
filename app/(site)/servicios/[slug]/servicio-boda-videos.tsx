"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { WaveText } from "@/app/wave-text";
import { ACOMPANAMIENTO_INQUIRY_OPEN_EVENT } from "@/lib/care-assist";

import "./servicio-boda-videos.css";

type BodaVideo = {
  src: string;
  label: string;
};

const VIDEOS: BodaVideo[] = [
  {
    src: "/assets/videos/acompanamiento/boda-4.webm",
    label: "Cuidado en el evento",
  },
  {
    src: "/assets/videos/acompanamiento/boda-1.webm",
    label: "Presencia en el día",
  },
  {
    src: "/assets/videos/acompanamiento/boda-2.webm",
    label: "Calma y vínculo",
  },
  {
    src: "/assets/videos/acompanamiento/boda-3.webm",
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
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const syncPlayback = useCallback((index: number) => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === index) {
        video.muted = true;
        void video.play().catch(() => {});
      } else {
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
    const root = document.getElementById("servicio-boda-videos");
    if (!root) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) syncPlayback(active);
        else videoRefs.current.forEach((v) => v?.pause());
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
    const stage = stageRef.current;
    if (!stage) return;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchRef.current = {
        x: e.touches[0]!.clientX,
        y: e.touches[0]!.clientY,
      };
    };
    const onEnd = (e: TouchEvent) => {
      const start = touchRef.current;
      touchRef.current = null;
      if (!start || e.changedTouches.length !== 1) return;
      const t = e.changedTouches[0]!;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) next();
      else prev();
    };

    stage.addEventListener("touchstart", onStart, { passive: true });
    stage.addEventListener("touchend", onEnd);
    return () => {
      stage.removeEventListener("touchstart", onStart);
      stage.removeEventListener("touchend", onEnd);
    };
  }, [next, prev]);

  const openForm = () => {
    document.body.dispatchEvent(new Event(ACOMPANAMIENTO_INQUIRY_OPEN_EVENT));
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
            id="servicio-boda-videos-heading"
            className="servicio-boda-videos__title"
          >
            Ellos también forman parte del día
          </h2>
          <p className="servicio-boda-videos__lead">
            Presencia serena, cuidado cercano y el vínculo intacto — para que
            podáis vivir el momento juntos.
          </p>
        </header>

        <div className="servicio-boda-videos__stage-wrap">
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

        <button
          type="button"
          className="servicio-boda-videos__cta nav-cta mob-link--wave"
          onClick={openForm}
        >
          <WaveText text="Reserva tu día" />
        </button>
      </div>
    </section>
  );
}
