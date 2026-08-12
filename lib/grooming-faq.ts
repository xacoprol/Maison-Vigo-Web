import type { MvcareFaqItem } from "@/lib/mvcare-content";

/** Preguntas frecuentes de la página `/servicios/grooming` (acordeón + FAQPage). */
export const groomingFaqIntro = {
  label: "Preguntas",
  title: "Dudas habituales sobre el grooming",
} as const;

export const groomingFaq: MvcareFaqItem[] = [
  {
    question: "¿Cuál es el precio orientativo de una sesión?",
    answer:
      "El precio depende del tamaño, el tipo de manto, el estado del pelo y el servicio concreto (baño, corte, stripping, ozonoterapia…). Te damos una orientación al reservar o en la primera visita, siempre con claridad y sin sorpresas.",
  },
  {
    question: "¿Cuánto dura una cita de peluquería canina?",
    answer:
      "La mayoría de sesiones de grooming duran entre una y tres horas. Perros de manto exigente, primer corte o tratamientos adicionales pueden necesitar más tiempo; priorizamos calma y calidad frente a la prisa.",
  },
  {
    question: "¿Qué razas atendéis?",
    answer:
      "Trabajamos con todas las razas y mestizos: pelo corto, doble capa, curly, sedoso o de stripping. Adaptamos técnica y cosmética a la morfología y sensibilidad de cada perro.",
  },
  {
    question: "¿En qué zona de Vigo estáis?",
    answer:
      "Maison Vigo está en Navia: Rúa das Teixugueiras 29, Portal 5, 36212 Vigo (Pontevedra). Atendemos a familias de toda la ciudad y alrededores con cita previa.",
  },
  {
    question: "¿Hace falta cita previa?",
    answer:
      "Sí. Trabajamos con cita previa para cuidar tiempos, estímulos y la atención individual que cada perro necesita. Puedes reservar desde el portal online o contactarnos por teléfono o WhatsApp.",
  },
];
