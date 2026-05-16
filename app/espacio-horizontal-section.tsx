"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

const espacioPanels = [
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
        la observación y el tiempo.{" "}
        Luz, materiales y ritmo acompañan cada experiencia desde la entrada.
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
    image: "/assets/images/caniche.webp",
    imageAlt: "Retrato editorial en Maison Vigo.",
    modifier: "espacio__panel--four",
  },
];

type EspacioScrollMeasure = {
  espacioStart: number;
  espacioDistance: number;
  espacioMaxTranslate: number;
};

export class EspacioHorizontalScroll {
  private espacioRoot: HTMLElement;
  private espacioTrack: HTMLElement;
  private espacioPanels: HTMLElement[];
  private espacioRafId = 0;
  private espacioTargetProgress = 0;
  private espacioCurrentProgress = 0;
  private espacioTargetTitleProgress = 0;
  private espacioCurrentTitleProgress = 0;
  private espacioMeasure: EspacioScrollMeasure = {
    espacioStart: 0,
    espacioDistance: 1,
    espacioMaxTranslate: 0,
  };
  private espacioReducedMotion = false;
  private espacioIsDestroyed = false;

  constructor(espacioRoot: HTMLElement) {
    const espacioTrack = espacioRoot.querySelector<HTMLElement>(
      "[data-espacio-track]",
    );
    if (!espacioTrack) {
      throw new Error("EspacioHorizontalScroll requires [data-espacio-track].");
    }

    this.espacioRoot = espacioRoot;
    this.espacioTrack = espacioTrack;
    this.espacioPanels = Array.from(
      espacioRoot.querySelectorAll<HTMLElement>("[data-espacio-panel]"),
    );
  }

  init() {
    this.espacioReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    this.onResize();
    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("resize", this.onResize);
    this.onScroll();
  }

  destroy() {
    this.espacioIsDestroyed = true;
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("resize", this.onResize);
    cancelAnimationFrame(this.espacioRafId);
    this.espacioRafId = 0;
  }

  onScroll = () => {
    const espacioScrollY = window.scrollY || window.pageYOffset;
    const espacioRawProgress =
      (espacioScrollY - this.espacioMeasure.espacioStart) /
      this.espacioMeasure.espacioDistance;

    this.espacioTargetProgress = this.espacioClamp(espacioRawProgress);
    this.espacioTargetTitleProgress = this.espacioClamp(
      (espacioScrollY -
        (this.espacioMeasure.espacioStart - window.innerHeight * 0.85)) /
        (window.innerHeight * 1.15),
    );
    this.espacioRoot.classList.toggle(
      "espacio--active",
      espacioRawProgress > 0 && espacioRawProgress < 1,
    );
    this.espacioRequestUpdate();
  };

  onResize = () => {
    const espacioRect = this.espacioRoot.getBoundingClientRect();
    const espacioScrollY = window.scrollY || window.pageYOffset;
    const espacioViewportW = window.innerWidth;
    const espacioViewportH = window.innerHeight;
    const espacioPanelCount = Math.max(this.espacioPanels.length, 1);

    this.espacioRoot.style.setProperty(
      "--espacio-panel-count",
      String(espacioPanelCount),
    );

    this.espacioMeasure = {
      espacioStart: espacioScrollY + espacioRect.top,
      espacioDistance: Math.max(
        this.espacioRoot.offsetHeight - espacioViewportH,
        1,
      ),
      espacioMaxTranslate: Math.max(
        this.espacioTrack.scrollWidth - espacioViewportW,
        espacioViewportW * (espacioPanelCount - 1),
      ),
    };

    this.onScroll();
  };

  update = () => {
    if (this.espacioIsDestroyed) return;

    if (this.espacioReducedMotion) {
      this.espacioCurrentProgress = this.espacioTargetProgress;
      this.espacioCurrentTitleProgress = this.espacioTargetTitleProgress;
    } else {
      this.espacioCurrentProgress +=
        (this.espacioTargetProgress - this.espacioCurrentProgress) * 0.09;
      this.espacioCurrentTitleProgress +=
        (this.espacioTargetTitleProgress - this.espacioCurrentTitleProgress) *
        0.035;
    }

    if (
      Math.abs(this.espacioTargetProgress - this.espacioCurrentProgress) < 0.0008
    ) {
      this.espacioCurrentProgress = this.espacioTargetProgress;
    }
    if (
      Math.abs(
        this.espacioTargetTitleProgress - this.espacioCurrentTitleProgress,
      ) < 0.0008
    ) {
      this.espacioCurrentTitleProgress = this.espacioTargetTitleProgress;
    }

    const espacioX =
      -this.espacioCurrentProgress * this.espacioMeasure.espacioMaxTranslate;

    this.espacioRoot.style.setProperty(
      "--espacio-progress",
      this.espacioCurrentProgress.toFixed(4),
    );
    this.espacioRoot.style.setProperty(
      "--espacio-title-progress",
      Math.min(
        this.espacioCurrentTitleProgress * 0.56 +
          this.espacioCurrentProgress * 0.44,
        1,
      ).toFixed(4),
    );
    this.espacioRoot.classList.toggle(
      "espacio--final",
      this.espacioCurrentProgress > 0.92,
    );
    this.espacioTrack.style.transform = `translate3d(${espacioX}px, 0, 0)`;

    if (
      this.espacioCurrentProgress !== this.espacioTargetProgress ||
      this.espacioCurrentTitleProgress !== this.espacioTargetTitleProgress
    ) {
      this.espacioRafId = requestAnimationFrame(this.update);
      return;
    }

    this.espacioRafId = 0;
  };

  private espacioRequestUpdate() {
    if (this.espacioRafId) return;
    this.espacioRafId = requestAnimationFrame(this.update);
  }

  private espacioClamp(espacioValue: number) {
    return Math.min(Math.max(espacioValue, 0), 1);
  }
}

export function EspacioHorizontalSection() {
  const espacioRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const espacioRoot = espacioRef.current;
    if (!espacioRoot) return;

    const espacioScroll = new EspacioHorizontalScroll(espacioRoot);
    espacioScroll.init();
    return () => espacioScroll.destroy();
  }, []);

  return (
    <section
      ref={espacioRef}
      id="espacio"
      className="espacio"
      data-espacio
      aria-label="Espacio editorial Maison Vigo"
    >
      <div className="espacio__sticky">
        <div className="espacio__track" data-espacio-track>
          {espacioPanels.map((espacioPanel, espacioIndex) => (
            <article
              className={`espacio__panel ${espacioPanel.modifier}`}
              data-espacio-panel
              key={espacioPanel.id}
              style={
                {
                  "--espacio-panel-index": espacioIndex,
                } as React.CSSProperties
              }
            >
              <div className="espacio__panel-grid">
                <figure className="espacio__image-frame">
                  <Image
                    src={espacioPanel.image}
                    alt={espacioPanel.imageAlt}
                    fill
                    sizes="100vw"
                    className="espacio__image"
                    quality={88}
                  />
                </figure>

                <div className="espacio__copy">
                  <p className="espacio__eyebrow">{espacioPanel.eyebrow}</p>
                  <h2 className="espacio__title">{espacioPanel.title}</h2>
                  <p className="espacio__body">{espacioPanel.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="espacio__right-fade" aria-hidden={true} />
      </div>
    </section>
  );
}
