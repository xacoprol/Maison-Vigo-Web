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
   * Párrafos SEO adicionales (fuera del hero) cuando el servicio necesita
   * más profundidad editorial sin alterar el layout de scroll.
   */
  seoBody?: string[];
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
      "Corte y grooming de perro en Maison Vigo, peluquería canina en Vigo",
    subtitle: "Dermocosmética y cuidado\nadaptado a cada perro.",
    body:
      "Cada sesión de grooming cuida la piel, el manto y el bienestar con un " +
      "enfoque respetuoso y sereno. Combinamos técnica, dermocosmética y " +
      "observación para adaptar el trabajo a lo que cada perro necesita en " +
      "ese momento.",
    /**
     * Párrafos SEO editoriales (fuera del hero) para no romper el layout
     * de scroll del hero. Se muestran en `/servicios/grooming`.
     */
    seoBody: [
      "Cada sesión de grooming cuida la piel, el manto y el bienestar con un enfoque respetuoso y sereno. Combinamos técnica, dermocosmética y observación para adaptar el trabajo a lo que cada perro necesita en ese momento. En nuestra peluquería canina Vigo, el protocolo puede incluir baño con cosmética adecuada, corte adaptado al estilo de vida, deslanado cuando el manto lo pide y corte de uñas con precisión y calma. No forzamos un resultado estándar: escuchamos al perro y a la familia para que el cuidado sea cómodo, limpio y duradero entre visitas.",
      "Atendemos todas las razas y tipos de manto —desde pelo corto y doble capa hasta curly, sedoso o de stripping— con protocolos distintos para cada textura. El grooming canino Vigo que practicamos une técnica de salón y sensibilidad: tiempos pausados, agarres suaves y un entorno reducido. También ofrecemos estética canina Vigo pensada para el día a día: cortes comerciales fáciles de mantener y cortes de raza cuando la morfología lo aconseja. Cada perro entra con su historia; nosotros aportamos método, dermocosmética profesional y una mirada atenta a picores, grasa o sensibilidad cutánea.",
      "La diferencia de Maison Vigo está en cómo cuidamos: calma como prioridad, técnica precisa y dermocosmética elegida caso a caso. Un corte de perros en Vigo aquí no es solo apariencia; es higiene, confort y prevención. Trabajamos sin aglomeraciones, con continuidad entre sesiones y recomendaciones claras para casa. Si buscas un espacio donde el resultado se vea y se sienta —pelo sano, piel equilibrada y un perro más tranquilo—, este es nuestro modo de acompañaros, con la misma atención, sesión tras sesión.",
    ],
  },
  bienestar: {
    slug: "bienestar",
    title: "Bienestar",
    carouselLabel: "Bienestar",
    image: "/cuidado.webp",
    imageAlt: "Cuidado de bienestar y piel en Maison Vigo, Vigo",
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
    imageAlt: "Guardería familiar para perros en Maison Vigo, Vigo",
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
    imageAlt: "Acompañamiento personalizado de perros en Maison Vigo",
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
    imageAlt: "Educación canina y convivencia en Maison Vigo, Vigo",
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
