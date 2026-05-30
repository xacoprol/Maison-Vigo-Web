export type RitmoCuidadoStep = {
  title: string;
  img: string;
  desc: string[];
};

export const RITMO_CUIDADO_STEPS: RitmoCuidadoStep[] = [
  {
    title: "Primer contacto",
    img: "/assets/images/primer-contacto.webp",
    desc: [
      "Cada perro llega con su propio ritmo.",
      "Observamos su comportamiento, necesidades y sensibilidad para crear una experiencia tranquila desde el primer momento.",
      "Sin prisas. Sin estrés innecesario.",
    ],
  },
  {
    title: "Diagnóstico",
    img: "/assets/images/diagnostico.webp",
    desc: [
      "Analizamos el estado de la piel y el manto antes de comenzar.",
      "Hidratación, sensibilidad, muda o necesidades específicas forman parte del cuidado.",
      "Cada sesión se adapta a su momento real.",
    ],
  },
  {
    title: "Ritual de baño",
    img: "/assets/images/ritual-de-bano.webp",
    desc: [
      "Trabajamos con cosmética seleccionada según el tipo de piel y manto.",
      "El baño no es solo higiene: es bienestar, equilibrio y recuperación.",
      "Cuidado suave y respetuoso en cada fase.",
    ],
  },
  {
    title: "Secado",
    img: "/assets/images/secado.webp",
    desc: [
      "Adaptamos el proceso de secado al ritmo y tolerancia de cada perro.",
      "Buscamos una experiencia lo más cómoda y progresiva posible, reduciendo sobreestimulación y tensión innecesaria.",
      "Calma, observación y cuidado durante todo el proceso.",
    ],
  },
  {
    title: "Acabados",
    img: "/assets/images/grooming.webp",
    desc: [
      "El acabado se realiza respetando la estructura, comodidad y naturalidad de cada perro.",
      "Buscamos armonía, limpieza y equilibrio visual sin excesos.",
      "Cada detalle tiene intención.",
    ],
  },
  {
    title: "Continuidad",
    img: "/assets/images/continuidad.webp",
    desc: [
      "El cuidado continúa más allá de la sesión.",
      "MV Care reúne historial, recomendaciones y continuidad personalizada para cada perro.",
      "Una forma más tranquila de acompañar su bienestar.",
    ],
  },
];
