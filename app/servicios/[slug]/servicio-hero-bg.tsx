"use client";

import Image from "next/image";
import { useState } from "react";

type ServicioHeroBgProps = {
  src: string;
  alt: string;
};

/**
 * Imagen de fondo del hero de cada servicio. Pintamos `opacity: 0` y solo
 * activamos el fade (`is-loaded` → transition en CSS) cuando `next/image`
 * confirma que la imagen está decodificada y lista. Así evitamos el "pop"
 * brusco si la animación termina antes de que la imagen haya cargado.
 */
export function ServicioHeroBg({ src, alt }: ServicioHeroBgProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority
      sizes="100vw"
      quality={82}
      className={
        loaded ? "servicio__hero-bg is-loaded" : "servicio__hero-bg"
      }
      onLoad={() => setLoaded(true)}
    />
  );
}
