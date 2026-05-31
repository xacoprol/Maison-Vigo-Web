import { bookingUrl } from "./site-config";

export const mvcareBookingUrl = bookingUrl;

export const mvcareHero = {
  logoSrc: "/assets/images/mvcare.svg",
  logoAlt: "MV Care",
  titleEl: "El",
  titleLine1Rest: "cuidado continúa",
  titleLine2: "más allá de cada sesión",
  subtitle:
    "Seguimiento personalizado para el bienestar y cuidado continuo de la mascota",
} as const;

export const mvcareWhatIs = {
  eyebrow: "Qué es",
  title: "Tu espacio privado con Maison Vigo",
  paragraphs: [
    "MV Care es el espacio digital de Maison Vigo para quienes confían en nosotros el cuidado de su perro. No sustituye la visita al salón: la prolonga con calma, claridad y continuidad.",
    "Tras cada sesión, el cuidado no se queda en la puerta. Historial, observaciones de piel y manto, recomendaciones para casa y próximas citas viven en un mismo lugar, pensado para leer con tranquilidad.",
    "Es una forma más serena de acompañar su bienestar: sin prisa, con la misma atención al detalle que en el espacio físico.",
  ],
} as const;

export type MvcareFeature = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export const mvcareFeaturesSection = {
  masthead: "Qué incluye",
  subtitle: "Todo lo que acompaña su cuidado",
  slideLabel: "Qué incluye",
} as const;

export const mvcareFeatures: MvcareFeature[] = [
  {
    title: "Panel personal",
    description:
      "Próximas citas con fecha y estado, reserva de sesiones con prioridad de disponibilidad y tarjeta digital para la recepción.",
    image: "/assets/images/primer-contacto.webp",
    imageAlt: "Bienvenida y acompañamiento en Maison Vigo.",
  },
  {
    title: "Perfil de cada mascota",
    description:
      "Varias mascotas en un mismo espacio, con pestañas para consultar la ficha de cada compañero cuando lo necesites.",
    image: "/assets/images/caniche.webp",
    imageAlt: "Retrato de perro en Maison Vigo.",
  },
  {
    title: "Piel y manto",
    description:
      "Observaciones de la última visita y fotos de referencia para entender la evolución del manto entre sesiones.",
    image: "/assets/images/diagnostico.webp",
    imageAlt: "Observación del manto en sesión de grooming.",
  },
  {
    title: "Plan e historial",
    description:
      "Frecuencia recomendada, hábitos en casa y registro de cada sesión para ver cómo avanza su cuidado.",
    image: "/assets/images/grooming.webp",
    imageAlt: "Sesión de grooming en Maison Vigo.",
  },
  {
    title: "Selección Maison Vigo",
    description:
      "Productos alineados con la rutina de cada perro, con carrito y pedido desde el mismo espacio.",
    image: "/assets/images/ritual-de-bano.webp",
    imageAlt: "Ritual de baño y cuidado en Maison Vigo.",
  },
  {
    title: "Continuidad y recordatorios",
    description:
      "Recomendaciones claras tras cada visita, avisos de próxima sesión o antiparasitario y beneficios ligados al cuidado continuado.",
    image: "/assets/images/continuidad.webp",
    imageAlt: "Continuidad del cuidado en Maison Vigo.",
  },
];

export const mvcareContinuity = {
  eyebrow: "Continuidad",
  title: "Una forma más tranquila de acompañar su bienestar",
  quote:
    "MV Care reúne historial, recomendaciones y continuidad personalizada para cada perro.",
  body: "El cuidado continúa más allá de la sesión. Desde el panel puedes retomar lo acordado en salón, sin tener que recordarlo todo: tiempos, productos, próximos pasos.",
  linkLabel: "Conocer el ritmo del cuidado en salón",
  linkHref: "/#ritmo-cuidado",
  image: "/assets/images/continuidad.webp",
  imageAlt: "Continuidad del cuidado Maison Vigo.",
} as const;

export type MvcareStep = {
  number: string;
  title: string;
  description: string;
};

export const mvcareSteps: MvcareStep[] = [
  {
    number: "01",
    title: "Visita en Maison Vigo",
    description:
      "Conocemos a tu perro en el espacio, observamos piel y manto y acordamos el ritmo de cuidado.",
  },
  {
    number: "02",
    title: "Acceso a MV Care",
    description:
      "Tras el registro, entras en tu panel con citas, historial y recomendaciones personalizadas.",
  },
  {
    number: "03",
    title: "Seguimiento entre sesiones",
    description:
      "Consultas el plan en casa, reservas con comodidad y mantienes la continuidad del cuidado.",
  },
];

export type MvcareFaqItem = {
  question: string;
  answer: string;
};

export const mvcareFaq: MvcareFaqItem[] = [
  {
    question: "¿Tiene algún coste acceder a MV Care?",
    answer:
      "El acceso al espacio digital forma parte de la experiencia Maison Vigo para clientes activos. Si tienes dudas sobre tu caso, pregunta en tu próxima visita o al reservar.",
  },
  {
    question: "¿Cómo entro por primera vez?",
    answer:
      "Utiliza el enlace de acceso al portal de reservas con el correo con el que reservas en Maison Vigo. Si es tu primera vez, el equipo te orientará en recepción.",
  },
  {
    question: "¿Puedo tener varias mascotas?",
    answer:
      "Sí. Cada compañero tiene su ficha y su historial. Cambias de perfil con pestañas sin mezclar información.",
  },
  {
    question: "¿Qué encontraré tras cada cita?",
    answer:
      "Observaciones de la sesión, recomendaciones para casa cuando aplique, estado de próximas citas y, si corresponde, productos sugeridos para su rutina.",
  },
];

export const mvcareBenefitsCol1: string[] = [
  "Historial de visitas y cuidados",
  "Plan de cuidado en casa entre sesiones",
  "Próximas citas y reserva cómoda",
  "Selección de productos para el cuidado y el vínculo",
];

export const mvcareBenefitsCol2: string[] = [
  "Seguimiento de piel y manto",
  "Recomendaciones adaptadas a cada perro",
  "Beneficios vinculados a la continuidad del cuidado",
];

/** Los 7 ítems en orden (referencia / SEO). */
export const mvcareBenefits: string[] = [
  ...mvcareBenefitsCol1,
  ...mvcareBenefitsCol2,
];

export const mvcareClose = {
  title: "El cuidado no termina al salir por la puerta",
  body: "Accede a tu espacio MV Care o reserva la próxima sesión con la misma calma con la que cuidamos en salón.",
} as const;
