import { bookingUrl } from "./site-config";

export const mvcareBookingUrl = bookingUrl;

export const mvcareHero = {
  logoSrc: "/assets/images/mvcare.svg",
  logoAlt: "MV Care",
  titleEl: "El",
  titleLine1Rest: "cuidado continúa",
  titleLine2: "más allá de cada sesión",
  subtitle:
    "Tu panel privado: citas, historial y recomendaciones entre visitas",
  image: "/assets/images/la-bienvenida.webp",
  imageAlt: "Bienvenida en Maison Vigo — MV Care.",
} as const;

export type MvcareWhatIsParagraph =
  | string
  | {
      before: string;
      highlight: string;
      after: string;
    };

export const mvcareWhatIs = {
  eyebrow: "Qué es",
  titleLine1: "Tu espacio privado",
  titleLine2Before: "con ",
  titleLine2Highlight: "Maison Vigo",
  paragraphs: [
    "MV Care es el espacio digital de Maison Vigo para quienes confían en nosotros el cuidado de su perro. No sustituye la visita al salón: la prolonga con claridad y continuidad.",
    {
      before: "Tras cada sesión, ",
      highlight:
        "historial, observaciones de piel y manto, recomendaciones para casa y próximas citas",
      after: " viven en un mismo lugar, pensado para consultar con calma.",
    },
  ] satisfies MvcareWhatIsParagraph[],
  ritmoLink: {
    label: "Conocer el ritmo del cuidado en salón",
    href: "/#ritmo-cuidado",
  },
} as const;

export type MvcareFeature = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export const mvcareFeaturesSection = {
  masthead: "Qué incluye",
  subtitleLine1: "Todo lo que acompaña",
  subtitleLine2: "su cuidado",
} as const;

export const mvcareFeatures: MvcareFeature[] = [
  {
    title: "Panel personal",
    description:
      "Próximas citas con fecha y estado, reserva de sesiones con prioridad de disponibilidad y tarjeta digital para la recepción.",
    image: "/assets/images/mvcare-1.webp",
    imageAlt: "Panel personal MV Care — Maison Vigo.",
  },
  {
    title: "Perfil de cada mascota",
    description:
      "Varias mascotas en un mismo espacio, con pestañas para consultar la ficha de cada compañero cuando lo necesites.",
    image: "/assets/images/mvcare-2.webp",
    imageAlt: "Perfil de mascota en MV Care — Maison Vigo.",
  },
  {
    title: "Piel y manto",
    description:
      "Observaciones de la última visita y fotos de referencia para entender la evolución del manto\u00A0entre sesiones.",
    image: "/assets/images/mvcare-3.webp",
    imageAlt: "Seguimiento de piel y manto en MV Care — Maison Vigo.",
  },
  {
    title: "Plan e historial",
    description:
      "Frecuencia recomendada, hábitos en casa y registro de cada sesión para ver cómo avanza su cuidado.",
    image: "/assets/images/mvcare-4.webp",
    imageAlt: "Plan e historial de cuidado en MV Care — Maison Vigo.",
  },
  {
    title: "Selección Maison Vigo",
    description:
      "Productos alineados con la rutina de cada perro, con carrito y pedido desde el mismo espacio.",
    image: "/assets/images/mvcare-5.webp",
    imageAlt: "Selección de productos Maison Vigo en MV Care.",
  },
  {
    title: "Continuidad y recordatorios",
    description:
      "Recomendaciones claras tras cada visita, avisos de próxima sesión o antiparasitario y beneficios ligados al cuidado continuado.",
    image: "/assets/images/mvcare-6.webp",
    imageAlt: "Continuidad y recordatorios en MV Care — Maison Vigo.",
  },
];

export const mvcareStart = {
  eyebrow: "Cómo empezar",
  titleLine1: "Tres",
  titleLine2: "pasos",
  faqLabel: "Preguntas",
  faqLead: "Las dudas más habituales",
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
  "Retomas cada visita sin empezar de cero",
  "Sabes qué hacer en casa entre sesiones",
  "Reservas sin llamar ni recordar fechas",
  "Productos elegidos para su rutina, no un catálogo genérico",
];

export const mvcareBenefitsCol2: string[] = [
  "Ves cómo evoluciona su manto en el tiempo",
  "Recomendaciones hechas para él, no plantillas",
  "Más continuidad, más ventajas en el cuidado",
];

/** Los 7 ítems en orden (referencia / SEO). */
export const mvcareBenefits: string[] = [
  ...mvcareBenefitsCol1,
  ...mvcareBenefitsCol2,
];

export const mvcareBenefitsSection = {
  titleBefore: "Lo\u00A0que\u00A0ganas",
  titleBrand: "con\u00A0MV\u00A0Care",
} as const;

export const mvcareClose = {
  title: "El cuidado no termina al salir por la puerta",
  body: "Entra en tu panel para ver tu plan de cuidado, o reserva la próxima sesión cuando lo necesites.",
  video: "/assets/videos/mvcare-cuidado-casa.webm",
} as const;
