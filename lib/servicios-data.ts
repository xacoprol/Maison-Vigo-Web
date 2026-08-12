/**
 * Fuente única para los 5 servicios destacados de Maison Vigo.
 * Consumido por el carrusel (home) y por las páginas `/servicios/[slug]`.
 */
export type ServicioSlug =
  | "grooming"
  | "bienestar"
  | "guarderia-familiar"
  | "acompanamiento"
  | "educacion";

export interface Servicio {
  slug: ServicioSlug;
  title: string;
  carouselLabel: string;
  image: string;
  imageAlt: string;
  subtitle: string;
  /** Texto editorial mostrado al hacer scroll en la ficha del servicio. */
  body: string;
  /**
   * Logo opcional que aparece encima del bloque `body` (de momento solo
   * `guarderia-familiar` usa el logo `MV Home`).
   */
  bodyLogo?: {
    src: string;
    alt: string;
  };
}

export const SERVICIOS: Record<ServicioSlug, Servicio> = {
  grooming: {
    slug: "grooming",
    title: "Grooming",
    carouselLabel: "Grooming",
    image: "/grooming.webp",
    imageAlt:
      "Grooming canino profesional en Maison Vigo, Vigo",
    subtitle: "Dermocosmética y cuidado\nadaptado a cada perro.",
    body:
      "Cada sesión de grooming cuida la piel, el manto y el bienestar con un " +
      "enfoque respetuoso y sereno. Combinamos técnica, dermocosmética y " +
      "observación para adaptar el trabajo a lo que cada perro necesita en " +
      "ese momento.",
  },
  bienestar: {
    slug: "bienestar",
    title: "Bienestar",
    carouselLabel: "Bienestar",
    image: "/cuidado.webp",
    imageAlt: "Bienestar y cuidado de piel en Maison Vigo, peluquería canina en Vigo",
    subtitle:
      "Diagnóstico, cosmética y cuidados adaptados a las necesidades de cada perro.",
    body:
      "El bienestar va más allá de una sesión puntual. Aquí acompañamos la " +
      "piel y el manto con diagnóstico, cosmética y seguimiento, en un espacio " +
      "donde el tiempo, los estímulos y la forma de trabajar importan tanto " +
      "como el resultado.",
  },
  "guarderia-familiar": {
    slug: "guarderia-familiar",
    title: "Guardería Familiar",
    carouselLabel: "Guardería Familiar",
    image: "/guarderia.webp",
    imageAlt: "Guardería canina familiar en Vigo — Maison Vigo",
    subtitle:
      "Un entorno reducido, tranquilo y supervisado donde sentirse seguro y acompañado.",
    body:
      "MV Home es un espacio de estancias de día y también de noche, pensado " +
      "para que se sientan seguros y acompañados. Rutinas calmadas, descanso, " +
      "tiempo al aire libre y una supervisión cercana forman parte de una " +
      "experiencia cuidada desde el bienestar emocional de cada perro.",
    bodyLogo: {
      src: "/assets/images/mvhome.svg",
      alt: "MV Home",
    },
  },
  acompanamiento: {
    slug: "acompanamiento",
    title: "Acompañamiento",
    carouselLabel: "Acompañamiento",
    image: "/acompanamiento.webp",
    imageAlt: "Acompañamiento canino en eventos — Maison Vigo, Vigo",
    subtitle:
      "Presencia y cuidado para que tu perro forme parte de los momentos especiales.",
    body:
      "Hay momentos que piden algo más que un servicio. Estamos presentes en " +
      "bodas, celebraciones y días especiales cuidando a tu perro, para que " +
      "podáis estar con él y vivir ese momento juntos — con la misma calma y " +
      "atención de siempre.",
  },
  educacion: {
    slug: "educacion",
    title: "Educación",
    carouselLabel: "Educación",
    image: "/educacion.webp",
    imageAlt: "Educación canina en Maison Vigo, Vigo",
    subtitle:
      "Trabajo enfocado en convivencia, equilibrio y bienestar emocional.",
    body:
      "Acompañamos a cada familia desde la comprensión y el vínculo, con un " +
      "trabajo respetuoso y adaptado a cada perro y a su entorno. Buscamos " +
      "rutinas y una convivencia más tranquilas, con herramientas claras para " +
      "el día a día.",
  },
};

export const servicioSlugs = Object.keys(SERVICIOS) as ServicioSlug[];

export const serviciosList: Servicio[] = servicioSlugs.map(
  (slug) => SERVICIOS[slug],
);

export function getServicio(slug: string): Servicio | undefined {
  return SERVICIOS[slug as ServicioSlug];
}

/** Mapa rótulo del carrusel → slug de la página interior. */
const labelToSlug: Record<string, ServicioSlug> = serviciosList.reduce(
  (acc, item) => {
    acc[item.carouselLabel] = item.slug;
    return acc;
  },
  {} as Record<string, ServicioSlug>,
);

export function servicioSlugFromLabel(label: string): ServicioSlug | undefined {
  return labelToSlug[label];
}
