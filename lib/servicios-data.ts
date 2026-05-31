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
    imageAlt: "Sesión de grooming en Maison Vigo.",
    subtitle: "Dermocosmética y cuidado\nadaptado a cada perro.",
    body:
      "Cada sesión de grooming está diseñada para cuidar la piel, el manto y " +
      "el bienestar de cada perro desde un enfoque respetuoso y personalizado. " +
      "Combinamos conocimiento técnico, dermocosmética y observación para " +
      "ofrecer un cuidado adaptado a sus necesidades reales.",
  },
  bienestar: {
    slug: "bienestar",
    title: "Bienestar",
    carouselLabel: "Bienestar",
    image: "/cuidado.webp",
    imageAlt: "Cuidado de bienestar en Maison Vigo.",
    subtitle:
      "Diagnóstico, cosmética y cuidados adaptados a las necesidades de cada perro.",
    body:
      "El bienestar va mucho más allá de una sesión puntual. En Maison Vigo " +
      "cuidamos el entorno, los tiempos, los estímulos y cada detalle para " +
      "crear experiencias más calmadas, equilibradas y agradables. La luz, " +
      "el aroma, los materiales y la forma de acompañar forman parte de un " +
      "espacio pensado para favorecer la tranquilidad, el confort y la " +
      "confianza de cada compañero.",
  },
  "guarderia-familiar": {
    slug: "guarderia-familiar",
    title: "Guardería Familiar",
    carouselLabel: "Guardería Familiar",
    image: "/guarderia.webp",
    imageAlt: "Guardería familiar en Maison Vigo.",
    subtitle:
      "Un entorno reducido, tranquilo y supervisado donde sentirse seguro y acompañado.",
    body:
      "MV Home nace como un espacio de estancias de día pensado para que " +
      "puedan sentirse seguros, tranquilos y acompañados en un entorno " +
      "familiar. Rutinas calmadas, descanso, tiempo al aire libre y " +
      "atención personalizada forman parte de una experiencia creada desde " +
      "el cuidado diario y el bienestar emocional de cada perro.",
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
    imageAlt: "Acompañamiento personalizado Maison Vigo.",
    subtitle:
      "Presencia y cuidado en momentos donde no puedes estar con ellos.",
    body:
      "Hay momentos que necesitan algo más que un servicio. Acompañamientos " +
      "personalizados para seguir cuidando desde la cercanía, la confianza " +
      "y la continuidad. Una forma de estar presentes también fuera de la " +
      "rutina habitual.",
  },
  educacion: {
    slug: "educacion",
    title: "Educación",
    carouselLabel: "Educación",
    image: "/educacion.webp",
    imageAlt: "Trabajo de educación canina Maison Vigo.",
    subtitle:
      "Trabajo enfocado en convivencia, equilibrio y bienestar emocional.",
    body:
      "Acompañamos a cada familia desde la comprensión y el vínculo, " +
      "ayudando a mejorar rutinas, convivencia y comunicación. Trabajamos " +
      "desde un enfoque respetuoso y adaptado a las necesidades reales de " +
      "cada perro y su entorno, buscando construir relaciones más " +
      "tranquilas, equilibradas y conscientes en el día a día.",
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
