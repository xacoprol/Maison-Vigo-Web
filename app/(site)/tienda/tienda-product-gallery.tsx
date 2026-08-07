"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { webStoreFileUrl } from "@/lib/web-store/utils";

type Props = {
  photos: { url: string }[];
  alt: string;
};

export function TiendaProductGallery({ photos, alt }: Props) {
  const urls = photos
    .map((photo) => webStoreFileUrl(photo.url))
    .filter((url): url is string => Boolean(url));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const multi = urls.length > 1;

  const syncIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || urls.length <= 1) return;
    const width = el.clientWidth || 1;
    const next = Math.round(el.scrollLeft / width);
    setIndex(Math.min(Math.max(next, 0), urls.length - 1));
  }, [urls.length]);

  const goTo = useCallback(
    (next: number) => {
      const el = scrollRef.current;
      if (!el || next < 0 || next >= urls.length) return;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
      setIndex(next);
    },
    [urls.length],
  );

  useEffect(() => {
    setIndex(0);
    const el = scrollRef.current;
    if (el) el.scrollLeft = 0;
  }, [urls.join("|")]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !multi) return;
    el.addEventListener("scroll", syncIndex, { passive: true });
    const ro = new ResizeObserver(syncIndex);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", syncIndex);
      ro.disconnect();
    };
  }, [multi, syncIndex]);

  if (urls.length === 0) {
    return <div className="tienda-sheet__media" aria-hidden={true} />;
  }

  return (
    <div className="tienda-sheet__media">
      <div
        ref={scrollRef}
        className="tienda-sheet__gallery"
        aria-roledescription="carrusel"
        aria-label={alt}
      >
        {urls.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="tienda-sheet__gallery-slide"
            aria-hidden={i !== index}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={i === 0 ? alt : ""} />
          </div>
        ))}
      </div>

      {multi ? (
        <>
          <button
            type="button"
            className="tienda-sheet__gallery-nav tienda-sheet__gallery-nav--prev"
            aria-label="Imagen anterior"
            disabled={index <= 0}
            onClick={() => goTo(index - 1)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/iconos/arrow-left.svg"
              alt=""
              width={18}
              height={18}
              className="tienda-sheet__gallery-nav-icon"
            />
          </button>
          <button
            type="button"
            className="tienda-sheet__gallery-nav tienda-sheet__gallery-nav--next"
            aria-label="Imagen siguiente"
            disabled={index >= urls.length - 1}
            onClick={() => goTo(index + 1)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/iconos/arrow-right.svg"
              alt=""
              width={18}
              height={18}
              className="tienda-sheet__gallery-nav-icon"
            />
          </button>
          <div className="tienda-sheet__gallery-dots" role="tablist" aria-label="Fotos">
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
                onClick={() => goTo(i)}
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
