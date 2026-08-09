"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

/** Distancia circular; visibles solo −1 / 0 / 1 (3 a la vista). */
function slotFor(index: number, active: number, total: number) {
  let d = index - active;
  if (d > total / 2) d -= total;
  if (d < -total / 2) d += total;
  return d;
}

export function ServicioBodaVideos() {
  const [active, setActive] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

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

  const prev = () => setActive((i) => (i + VIDEOS.length - 1) % VIDEOS.length);
  const next = () => setActive((i) => (i + 1) % VIDEOS.length);

  const openForm = () => {
    document.body.dispatchEvent(new Event(ACOMPANAMIENTO_INQUIRY_OPEN_EVENT));
  };

  return (
    <section
      id="servicio-boda-videos"
      className="servicio-boda-videos"
      aria-labelledby="servicio-boda-videos-heading"
    >
      <div className="servicio-boda-videos__inner">
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

        <div className="servicio-boda-videos__stage" aria-live="polite">
          {VIDEOS.map((item, index) => {
            const slot = slotFor(index, active, VIDEOS.length);
            const isCenter = slot === 0;
            const isVisible = Math.abs(slot) <= 1;
            return (
              <button
                key={item.src}
                type="button"
                className={
                  "servicio-boda-videos__card" +
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
                  preload="metadata"
                  aria-hidden={true}
                />
                <span className="servicio-boda-videos__caption">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="servicio-boda-videos__nav">
          <button
            type="button"
            className="servicio-boda-videos__arrow"
            onClick={prev}
            aria-label="Vídeo anterior"
          >
            ‹
          </button>
          <div className="servicio-boda-videos__dots" role="tablist">
            {VIDEOS.map((item, index) => (
              <button
                key={item.src}
                type="button"
                role="tab"
                aria-selected={index === active}
                className={
                  "servicio-boda-videos__dot" +
                  (index === active ? " is-active" : "")
                }
                onClick={() => setActive(index)}
                aria-label={`Ver ${item.label}`}
              />
            ))}
          </div>
          <button
            type="button"
            className="servicio-boda-videos__arrow"
            onClick={next}
            aria-label="Vídeo siguiente"
          >
            ›
          </button>
        </div>

        <button
          type="button"
          className="servicio-boda-videos__cta nav-cta mob-link--wave"
          onClick={openForm}
        >
          Reserva tu día
        </button>
      </div>
    </section>
  );
}
