"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type ServicioHeroBgProps = {
  src: string;
  alt: string;
};

/**
 * Imagen de fondo del hero de cada servicio. Pintamos `opacity: 0` y solo
 * activamos el fade (`is-loaded` → transition en CSS) cuando la imagen está
 * lista. Comprobamos `complete` por si la imagen ya estaba en caché.
 */
export function ServicioHeroBg({ src, alt }: ServicioHeroBgProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const markLoaded = useCallback(() => {
    setLoaded(true);
    document.body.dispatchEvent(new Event("servicio-hero-media-ready"));
  }, []);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      markLoaded();
    }
  }, [markLoaded, src]);

  return (
    <Image
      ref={imgRef}
      src={src}
      alt={alt}
      fill
      priority
      sizes="100vw"
      quality={82}
      className={loaded ? "servicio__hero-bg is-loaded" : "servicio__hero-bg"}
      onLoad={markLoaded}
      onError={markLoaded}
    />
  );
}
