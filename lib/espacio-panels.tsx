import type { ReactNode } from "react";

export type EspacioPanel = {
  id: string;
  eyebrow: string;
  title: ReactNode;
  body: ReactNode;
  image: string;
  imageAlt: string;
  modifier: string;
};

export const espacioPanels: EspacioPanel[] = [
  {
    id: "espacio-01",
    eyebrow: "01. BIENVENIDA",
    title: (
      <>
        <span className="espacio__title-word espacio__title-word--cream">El</span>
        <span className="espacio__title-word espacio__title-word--gold">
          Espacio
        </span>
      </>
    ),
    body: (
      <>
        Maison Vigo nace como un espacio pensado para el cuidado desde la calma,
        la observación y el tiempo. La luz, los materiales, el aroma y el ritmo
        acompañan cada experiencia desde la entrada.
      </>
    ),
    image: "/assets/images/el-espacio.webp",
    imageAlt: "Imagen editorial del espacio Maison Vigo.",
    modifier: "espacio__panel--one",
  },
  {
    id: "espacio-02",
    eyebrow: "Espacio 02",
    title: (
      <>
        <span className="espacio__title-word espacio__title-word--cream">La</span>
        <span className="espacio__title-word espacio__title-word--gold">
          Bienvenida
        </span>
      </>
    ),
    body: (
      <>
        Materiales cálidos, iluminación suave y una atmósfera tranquila
        acompañan la llegada antes de cada sesión.
      </>
    ),
    image: "/assets/images/la-bienvenida.webp",
    imageAlt: "Detalle del espacio de bienvenida Maison Vigo.",
    modifier: "espacio__panel--two",
  },
  {
    id: "espacio-03",
    eyebrow: "Espacio 03",
    title: (
      <>
        <span className="espacio__title-word espacio__title-word--cream">The</span>
        <span className="espacio__title-word espacio__title-word--gold">
          Selection
        </span>
      </>
    ),
    body: (
      <>
        Cosmética, accesorios y objetos seleccionados bajo la misma mirada que
        guía cada cuidado en Maison Vigo.
      </>
    ),
    image: "/assets/images/secado.webp",
    imageAlt: "Textura visual del ritual de cuidado.",
    modifier: "espacio__panel--three",
  },
  {
    id: "espacio-04",
    eyebrow: "Espacio 04",
    title: (
      <>
        <span className="espacio__title-word espacio__title-word--cream">
          Grooming
        </span>
        <span className="espacio__title-word espacio__title-word--gold">
          Room
        </span>
      </>
    ),
    body: (
      <>
        Un espacio diseñado para trabajar desde la observación, el bienestar y el
        respeto por el ritmo de cada perro.
      </>
    ),
    image: "/assets/images/la-bienvenida.webp",
    imageAlt: "Detalle del espacio de bienvenida Maison Vigo.",
    modifier: "espacio__panel--four",
  },
];
