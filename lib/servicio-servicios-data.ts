import { RITMO_CUIDADO_STEPS } from "@/lib/ritmo-cuidado-steps";
import type { ServicioSlug } from "@/lib/servicios-data";

export type ServicioServiciosItem = {
  title: string;
  desc: string[];
};

const GROOMING_SERVICIOS: ServicioServiciosItem[] = [
  {
    title: "Dermocosmética personalizada",
    desc: [
      "Cada perro tiene unas necesidades específicas según su tipo de piel, textura de pelo, sensibilidad y estilo de vida. Por eso seleccionamos de forma individualizada los productos y protocolos más adecuados para cada caso.",
      "Trabajamos con cosmética profesional de alta calidad para ayudar a mantener el equilibrio cutáneo, mejorar la salud del manto y favorecer el bienestar general del perro, respetando siempre sus características naturales.",
    ],
  },
  {
    title: "Baño y mantenimiento",
    desc: [
      "El cuidado regular del manto es fundamental para mantener una piel sana y prevenir problemas futuros. Nuestros servicios de baño y mantenimiento ayudan a conservar el pelo limpio, hidratado y libre de nudos, mejorando tanto el confort como la apariencia del perro.",
      "Cada sesión se adapta a las necesidades de cada manto para garantizar resultados saludables y duraderos entre visitas.",
    ],
  },
  {
    title: "Corte comercial",
    desc: [
      "Realizamos cortes funcionales y equilibrados pensados para facilitar el mantenimiento diario y adaptarse al estilo de vida de cada familia.",
      "Buscamos un resultado natural, cómodo y armonioso, respetando siempre la estructura del perro y priorizando su bienestar por encima de criterios puramente estéticos.",
    ],
  },
  {
    title: "Corte de raza",
    desc: [
      "Respetamos los estándares y características propias de cada raza, adaptando el trabajo a la morfología, el tipo de pelo y las necesidades individuales de cada perro.",
      "Nuestro objetivo es conservar la identidad y belleza natural del manto, combinando técnica, conocimiento y cuidado personalizado.",
    ],
  },
  {
    title: "Stripping",
    desc: [
      "Técnica específica para perros de pelo duro que permite retirar el pelo maduro de forma adecuada, favoreciendo la renovación natural del manto y manteniendo su textura, color y funcionalidad.",
      "Realizado correctamente, el stripping ayuda a conservar la calidad del pelo y contribuye a una piel más sana y equilibrada.",
    ],
  },
  {
    title: "Ozonoterapia",
    desc: [
      "La ozonoterapia es un tratamiento complementario orientado a mejorar la salud de la piel y el bienestar del perro de forma natural.",
      "Gracias a sus propiedades higienizantes, calmantes y oxigenantes, resulta especialmente beneficiosa en perros con piel sensible, picores, exceso de grasa, mal olor o pequeñas alteraciones cutáneas. Combinada con protocolos de dermocosmética, ayuda a potenciar los resultados y proporcionar un cuidado más completo y respetuoso.",
    ],
  },
];

const BIENESTAR_SERVICIOS: ServicioServiciosItem[] = [
  {
    title: "Ozonoterapia",
    desc: [
      "Tratamiento complementario con propiedades higienizantes, calmantes y oxigenantes, especialmente indicado en piel sensible, picores o pequeñas alteraciones cutáneas.",
      "Combinada con protocolos de dermocosmética, ayuda a potenciar resultados y un cuidado más completo.",
    ],
  },
  {
    title: "Planes de cuidado cutáneo",
    desc: [
      "Protocolos personalizados según tipo de piel, textura del manto y sensibilidad de cada perro.",
      "Pensados para mantener el equilibrio cutáneo y la salud del pelo entre visitas.",
    ],
  },
  {
    title: "Seguimiento personalizado",
    desc: [
      "Acompañamiento continuo para revisar la evolución del manto y la piel y ajustar el cuidado cuando sea necesario.",
    ],
  },
  {
    title: "Recomendaciones para casa",
    desc: [
      "Indicaciones prácticas para prolongar en el hogar los beneficios del cuidado profesional y mantener rutinas saludables.",
    ],
  },
  {
    title: "Bienestar senior",
    desc: [
      "Cuidados adaptados a perros mayores: tiempos más calmados, productos suaves y atención a sus necesidades específicas de confort y salud.",
    ],
  },
];

const EDUCACION_SERVICIOS: ServicioServiciosItem[] = [
  {
    title: "Cachorros",
    desc: [
      "Acompañamiento en las primeras etapas para construir rutinas, seguridad y una convivencia equilibrada desde el inicio.",
    ],
  },
  {
    title: "Adaptación a nuevos entornos",
    desc: [
      "Apoyo en mudanzas, cambios de rutina o nuevas dinámicas familiares desde una mirada respetuosa y personalizada.",
    ],
  },
  {
    title: "Gestión emocional",
    desc: [
      "Trabajo orientado a mejorar la relación con el entorno, favoreciendo experiencias más tranquilas, seguras y positivas.",
    ],
  },
  {
    title: "Hábitos y rutinas",
    desc: [
      "Acompañamiento práctico en paseos, rutinas y situaciones cotidianas para crear herramientas útiles y sostenibles.",
    ],
  },
  {
    title: "Asesoramiento familiar",
    desc: [
      "Sesiones adaptadas a las necesidades de cada familia para mejorar comunicación, convivencia y bienestar en el día a día.",
    ],
  },
];

const GUARDERIA_SERVICIOS: ServicioServiciosItem[] = [
  {
    title: "Guardería de día",
    desc: [
      "Estancias diarias en un entorno reducido, tranquilo y supervisado, con rutinas calmadas y tiempo al aire libre.",
    ],
  },
  {
    title: "Adaptación progresiva",
    desc: [
      "Entrada gradual al espacio para que cada perro se familiarice con el entorno, las rutinas y el equipo con seguridad.",
    ],
  },
  {
    title: "Socialización controlada",
    desc: [
      "Interacciones supervisadas y adaptadas al carácter y el ritmo de cada perro, priorizando experiencias positivas.",
    ],
  },
  {
    title: "Actualizaciones durante la estancia",
    desc: [
      "Comunicación con la familia para compartir cómo transcurre la jornada y responder a cualquier necesidad.",
    ],
  },
  {
    title: "Recogida y entrega",
    desc: [
      "Servicio de recogida y entrega a domicilio para facilitar la logística y mantener la continuidad del cuidado.",
    ],
  },
];

const ACOMPANAMIENTO_SERVICIOS: ServicioServiciosItem[] = [
  {
    title: "Bodas",
    desc: [
      "Presencia y cuidado durante la celebración para que tu perro forme parte del día con tranquilidad y seguridad.",
    ],
  },
  {
    title: "Eventos familiares",
    desc: [
      "Acompañamiento en reuniones, celebraciones o momentos especiales donde necesitas que estén bien atendidos.",
    ],
  },
  {
    title: "Sesiones fotográficas",
    desc: [
      "Cuidado y calma durante sesiones de foto para que la experiencia sea positiva y cómoda para ellos.",
    ],
  },
  {
    title: "Recogidas y traslados",
    desc: [
      "Recogida y traslado con la misma atención personalizada, respetando tiempos y necesidades de cada perro.",
    ],
  },
  {
    title: "Acompañamientos personalizados",
    desc: [
      "Servicios a medida para situaciones concretas: viajes, compromisos o momentos en los que no puedes estar con ellos.",
    ],
  },
];

const DEFAULT_SERVICIOS: ServicioServiciosItem[] = RITMO_CUIDADO_STEPS.map(
  ({ title, desc }) => ({ title, desc }),
);

const SERVICIOS_BY_SLUG: Partial<Record<ServicioSlug, ServicioServiciosItem[]>> =
  {
    grooming: GROOMING_SERVICIOS,
    bienestar: BIENESTAR_SERVICIOS,
    educacion: EDUCACION_SERVICIOS,
    "guarderia-familiar": GUARDERIA_SERVICIOS,
    acompanamiento: ACOMPANAMIENTO_SERVICIOS,
  };

export function getServicioServiciosItems(
  slug: ServicioSlug,
): ServicioServiciosItem[] {
  return SERVICIOS_BY_SLUG[slug] ?? DEFAULT_SERVICIOS;
}
