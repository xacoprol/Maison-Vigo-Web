export type GroomingFaqItem = {
  question: string;
  answer: string;
};

/** FAQ pública de /servicios/grooming (acordeón + FAQPage JSON-LD). */
export const groomingFaqItems: GroomingFaqItem[] = [
  {
    question: "¿Cuánto cuesta una sesión de peluquería canina en Vigo?",
    answer:
      "El precio depende del tamaño, el tipo de manto, el estado del pelo y el servicio (baño, corte comercial, corte de raza, stripping…). Tras una primera valoración te proponemos una orientación clara y sin sorpresas. Para una cifra concreta, reserva cita o escríbenos con la raza y lo que necesitas.",
  },
  {
    question: "¿Cuánto dura una cita de grooming?",
    answer:
      "Una sesión suele ocupar entre una y tres horas según el trabajo. Priorizamos calma y técnica frente a la prisa: el ritmo lo marca el perro, no el reloj. Te confirmamos una estimación al reservar.",
  },
  {
    question: "¿Qué razas atendéis?",
    answer:
      "Trabajamos con todas las razas y mestizos. Adaptamos baño, deslanado, corte de uñas y acabado a la morfología y sensibilidad de cada perro, desde mantos cortos hasta pelo duro o de doble capa.",
  },
  {
    question: "¿Dónde estáis en Vigo y hace falta cita previa?",
    answer:
      "Estamos en Rúa das Teixugueiras 29 (Navia), 36212 Vigo. Atendemos con cita previa para cuidar el tiempo de cada perro y evitar esperas innecesarias. Puedes reservar online o por teléfono / WhatsApp.",
  },
  {
    question: "¿Qué incluye el grooming canino en Maison Vigo?",
    answer:
      "Según el protocolo: observación de piel y manto, baño con dermocosmética adecuada, secado respetuoso, deslanado si procede, corte o stripping, y detalles como uñas y acabado. El enfoque une estética canina en Vigo con bienestar y continuidad entre visitas.",
  },
];
