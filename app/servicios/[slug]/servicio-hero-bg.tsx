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
 * lista. Usamos `onLoadingComplete` y comprobación de `complete` por si la
 * imagen ya estaba en caché y `onLoad` no llega a dispararse.
 */
export function ServicioHeroBg({ src, alt }: ServicioHeroBgProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const markLoaded = useCallback(() => {
    setLoaded(true);
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
      onLoadingComplete={markLoaded}
      onError={markLoaded}
    />
  );
}
