import type { ServicioSlug } from "./servicios-data";

/** Contenido del carrusel scroll-locked tras el hero de cada servicio. */
export type ServicioSlideshowSlide = {
  caption: string;
  headline1: string;
  headline2: string;
  image: string;
  imageAlt: string;
};

const GROOMING_SLIDESHOW_SLIDES: ServicioSlideshowSlide[] = [
  {
    caption:
      "Cada sesión comienza observando el estado de la piel y el manto para adaptar el trabajo a las necesidades reales de cada perro.",
    headline1: "Diagnóstico y",
    headline2: "observación",
    image: "/assets/images/diagnostico.webp",
    imageAlt: "Diagnóstico del manto en Maison Vigo.",
  },
  {
    caption:
      "Seleccionamos la cosmética según el tipo de piel, textura del pelo y sensibilidad individual para conseguir resultados saludables y duraderos.",
    headline1: "Dermocosmética",
    headline2: "personalizada",
    image: "/assets/images/grooming.webp",
    imageAlt: "Dermocosmética personalizada en Maison Vigo.",
  },
  {
    caption:
      "Un manto cuidado no solo mejora la estética. Buscamos favorecer la salud de la piel, prevenir problemas y mantener el pelo en las mejores condiciones entre sesiones.",
    headline1: "Resultados",
    headline2: "saludables",
    image: "/assets/images/secado.webp",
    imageAlt: "Resultados saludables del cuidado del manto en Maison Vigo.",
  },
];

const BIENESTAR_SLIDESHOW_SLIDES: ServicioSlideshowSlide[] = [
  {
    caption:
      "El bienestar empieza antes de que aparezcan los problemas.",
    headline1: "Cuidar también",
    headline2: "es prevenir",
    image: "/assets/images/diagnostico.webp",
    imageAlt: "Cuidado preventivo de bienestar en Maison Vigo.",
  },
  {
    caption:
      "Cada perro necesita cuidados diferentes según su edad, estilo de vida y necesidades.",
    headline1: "Atención",
    headline2: "personalizada",
    image: "/assets/images/primer-contacto.webp",
    imageAlt: "Atención personalizada de bienestar en Maison Vigo.",
  },
  {
    caption:
      "Un acompañamiento orientado a mejorar su calidad de vida en el día a día.",
    headline1: "Más allá",
    headline2: "de la peluquería",
    image: "/assets/images/continuidad.webp",
    imageAlt: "Acompañamiento de bienestar en Maison Vigo.",
  },
];

const EDUCACION_SLIDESHOW_SLIDES: ServicioSlideshowSlide[] = [
  {
    caption:
      "Entendemos cada comportamiento desde la comprensión y el contexto, " +
      "no solo desde la corrección inmediata.",
    headline1: "Comprender antes",
    headline2: "que corregir",
    image: "/assets/images/educacion-1.webp",
    imageAlt: "Educación canina en Maison Vigo.",
  },
  {
    caption:
      "Cada perro tiene su propio ritmo, su historia y su forma de relacionarse con el entorno.",
    headline1: "Cada historia",
    headline2: "tiene su ritmo",
    image: "/assets/images/educacion-2.webp",
    imageAlt: "Acompañamiento educativo adaptado a cada perro.",
  },
  {
    caption:
      "Construimos herramientas para una convivencia más tranquila, segura y consciente desde la confianza.",
    headline1: "Convivencia desde",
    headline2: "la confianza",
    image: "/assets/images/educacion-3.webp",
    imageAlt: "Convivencia y confianza en Maison Vigo.",
  },
];

const GUARDERIA_SLIDESHOW_SLIDES: ServicioSlideshowSlide[] = [
  {
    caption:
      "Un entorno familiar, tranquilo y supervisado donde pueden sentirse seguros y acompañados.",
    headline1: "Como",
    headline2: "en casa",
    image: "/assets/images/guarderia-1.webp",
    imageAlt: "Guardería familiar Maison Vigo.",
  },
  {
    caption:
      "Grupos reducidos que permiten un cuidado más cercano, calmado y personalizado.",
    headline1: "Grupos",
    headline2: "reducidos",
    image: "/assets/images/guarderia-2.webp",
    imageAlt: "Grupos reducidos en MV Home.",
  },
  {
    caption:
      "Rutinas, descanso y atención adaptada al ritmo y las necesidades de cada perro.",
    headline1: "Atención",
    headline2: "individualizada",
    image: "/assets/images/guarderia-3.webp",
    imageAlt: "Atención individualizada en guardería familiar.",
  },
];

const ACOMPANAMIENTO_SLIDESHOW_SLIDES: ServicioSlideshowSlide[] = [
  {
    caption:
      "Estamos presentes en bodas, eventos y momentos especiales con el mismo cuidado y calma de siempre.",
    headline1: "Presencia en",
    headline2: "momentos importantes",
    image: "/assets/images/acompanamiento-1.webp",
    imageAlt: "Acompañamiento en eventos Maison Vigo.",
  },
  {
    caption:
      "Para que puedas vivir esos días con tranquilidad, sabiendo que están en buenas manos.",
    headline1: "Cuidado sin",
    headline2: "preocupaciones",
    image: "/assets/images/acompanamiento-2.webp",
    imageAlt: "Cuidado y tranquilidad en acompañamiento.",
  },
  {
    caption:
      "Una forma de seguir cuidando desde la cercanía, la confianza y la continuidad del vínculo.",
    headline1: "Un vínculo que",
    headline2: "también participa",
    image: "/assets/images/acompanamiento-3.webp",
    imageAlt: "Vínculo y acompañamiento personalizado Maison Vigo.",
  },
];

export const SERVICIO_SLIDESHOW_SLIDES: ServicioSlideshowSlide[] = [
  {
    caption:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Stitches are hidden and not visible.",
    headline1: "NO PAIN",
    headline2: "OR VISIBLE MARKS",
    image: "/assets/images/la-bienvenida.webp",
    imageAlt: "La bienvenida en Maison Vigo.",
  },
  {
    caption:
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.",
    headline1: "NATURAL",
    headline2: "RESULTS ONLY",
    image: "/assets/images/el-espacio.webp",
    imageAlt: "El espacio Maison Vigo.",
  },
  {
    caption:
      "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit sed quia consequuntur.",
    headline1: "FAST",
    headline2: "RECOVERY TIME",
    image: "/assets/images/ritual-de-bano.webp",
    imageAlt: "Ritual de baño Maison Vigo.",
  },
];

const SLIDESHOW_BY_SLUG: Partial<Record<ServicioSlug, ServicioSlideshowSlide[]>> =
  {
    grooming: GROOMING_SLIDESHOW_SLIDES,
    bienestar: BIENESTAR_SLIDESHOW_SLIDES,
    educacion: EDUCACION_SLIDESHOW_SLIDES,
    "guarderia-familiar": GUARDERIA_SLIDESHOW_SLIDES,
    acompanamiento: ACOMPANAMIENTO_SLIDESHOW_SLIDES,
  };

export function getServicioSlideshowSlides(
  slug: ServicioSlug,
): ServicioSlideshowSlide[] {
  return SLIDESHOW_BY_SLUG[slug] ?? SERVICIO_SLIDESHOW_SLIDES;
}
