"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { espacioPanels } from "@/lib/espacio-panels";

import { EspacioMobileSection } from "./espacio-mobile-section";

const ESPACIO_MOBILE_MQ = "(max-width: 900px)";

type EspacioScrollMeasure = {
  espacioStart: number;
  espacioDistance: number;
  espacioMaxTranslate: number;
};

export class EspacioHorizontalScroll {
  private espacioRoot: HTMLElement;
  private espacioSticky: HTMLElement;
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
  private espacioFirstIntroRevealed = false;
  private espacioSyncedScrollY: number | null = null;

  constructor(espacioRoot: HTMLElement) {
    const espacioSticky = espacioRoot.querySelector<HTMLElement>(
      ".espacio__sticky",
    );
    const espacioTrack = espacioRoot.querySelector<HTMLElement>(
      "[data-espacio-track]",
    );
    if (!espacioSticky || !espacioTrack) {
      throw new Error(
        "EspacioHorizontalScroll requires .espacio__sticky and [data-espacio-track].",
      );
    }

    this.espacioRoot = espacioRoot;
    this.espacioSticky = espacioSticky;
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
    /**
     * `mv-scroll` se emite por SiteEffects en todos los casos (con o sin
     * Lenis). Antes escuchábamos también `scroll` nativo y duplicábamos
     * la cadena de `getBoundingClientRect` en cada wheel-tick.
     */
    window.addEventListener("resize", this.onResize);
    window.addEventListener("mv-scroll", this.onMvScroll);
    if (this.espacioReducedMotion) {
      this.espacioRoot.style.setProperty("--espacio-intro-peek", "1");
      this.espacioPanels.forEach((espacioPanel, espacioIndex) => {
        if (espacioIndex === 0) {
          this.espacioRevealIntro(espacioPanel);
        } else {
          this.espacioRevealImage(espacioPanel);
          this.espacioRevealTitle(espacioPanel);
        }
      });
    }
    this.onScroll();
  }

  destroy() {
    this.espacioIsDestroyed = true;
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("mv-scroll", this.onMvScroll);
    cancelAnimationFrame(this.espacioRafId);
    this.espacioRafId = 0;
  }

  onMvScroll = (espacioEvent: Event) => {
    const espacioY = (espacioEvent as CustomEvent<{ y: number }>).detail?.y;
    if (typeof espacioY === "number") {
      this.espacioSyncedScrollY = espacioY;
      this.onScroll();
    }
  };

  private espacioGetScrollY() {
    return this.espacioSyncedScrollY ?? window.scrollY ?? window.pageYOffset;
  }

  onScroll = () => {
    const espacioRect = this.espacioRoot.getBoundingClientRect();
    const espacioViewportH = window.innerHeight;
    this.espacioUpdateIntroPeek(espacioRect, espacioViewportH);
    this.espacioMaybeRevealFirstIntro(espacioRect, espacioViewportH);
    const espacioSettled =
      Math.abs(this.espacioTargetProgress - this.espacioCurrentProgress) <
        0.002 &&
      Math.abs(
        this.espacioTargetTitleProgress - this.espacioCurrentTitleProgress,
      ) < 0.002;
    if (
      espacioSettled &&
      (espacioRect.bottom < -espacioViewportH * 0.25 ||
        espacioRect.top > espacioViewportH * 1.35)
    ) {
      return;
    }

    const espacioScrollY = this.espacioGetScrollY();
    const espacioDistance = this.espacioMeasure.espacioDistance;
    /**
     * Progreso ligado a la posición del bloque en el documento (no a un pin
     * capturado al entrar). Así el retroceso no salta a la 1.ª diapositiva.
     */
    const espacioRawProgress =
      espacioDistance > 0 ? -espacioRect.top / espacioDistance : 0;

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
    const espacioScrollY = this.espacioGetScrollY();
    const espacioViewportW = this.espacioSticky.clientWidth;
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
    const espacioPanelTravel =
      this.espacioCurrentProgress * Math.max(this.espacioPanels.length - 1, 1);

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
    this.espacioTrack.style.transform = `translate3d(${espacioX}px, 0, 0)`;
    this.espacioPanels.forEach((espacioPanel, espacioIndex) => {
      const espacioPanelParallax = this.espacioClamp(
        espacioIndex - espacioPanelTravel,
        -1,
        1,
      );
      espacioPanel.style.setProperty(
        "--espacio-image-parallax",
        espacioPanelParallax.toFixed(4),
      );
      if (espacioIndex === 1 || espacioIndex === 2 || espacioIndex === 3) {
        /* Sincronizado con la foto: parallax 1→-1, desplazamiento dorado 0→1 */
        const espacioGoldShift = this.espacioClamp(
          (1 - espacioPanelParallax) / 2,
          0,
          1,
        );
        espacioPanel.style.setProperty(
          "--espacio-gold-shift",
          espacioGoldShift.toFixed(4),
        );
      }
      if (
        !this.espacioReducedMotion &&
        espacioIndex > 0 &&
        espacioIndex - espacioPanelTravel < 0.92
      ) {
        this.espacioRevealImage(espacioPanel);
      }
      if (
        !this.espacioReducedMotion &&
        espacioIndex > 0 &&
        Math.abs(espacioIndex - espacioPanelTravel) < 0.38
      ) {
        this.espacioRevealTitle(espacioPanel);
      }
    });

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

  private espacioClamp(espacioValue: number, espacioMin = 0, espacioMax = 1) {
    return Math.min(Math.max(espacioValue, espacioMin), espacioMax);
  }

  /** Máximo peek por scroll: la foto asoma pero no llega arriba hasta el snap al pin. */
  private static readonly ESPACIO_INTRO_PEEK_CAP = 0.82;

  /** Avance de la foto del panel 1 mientras la sección aún no está pinada arriba. */
  private espacioUpdateIntroPeek(
    espacioRect: DOMRect,
    espacioViewportH: number,
  ) {
    if (this.espacioReducedMotion || this.espacioFirstIntroRevealed) {
      this.espacioRoot.style.setProperty("--espacio-intro-peek", "1");
      return;
    }

    if (espacioRect.top > espacioViewportH) {
      this.espacioRoot.style.setProperty("--espacio-intro-peek", "0");
      return;
    }

    if (espacioRect.top <= 0) {
      this.espacioRoot.style.setProperty(
        "--espacio-intro-peek",
        String(EspacioHorizontalScroll.ESPACIO_INTRO_PEEK_CAP),
      );
      return;
    }

    const peekRange = espacioViewportH * 0.88;
    const peek =
      (1 - Math.min(Math.max(espacioRect.top / peekRange, 0), 1)) *
      EspacioHorizontalScroll.ESPACIO_INTRO_PEEK_CAP;
    this.espacioRoot.style.setProperty("--espacio-intro-peek", peek.toFixed(3));
  }

  /** Cuando el sticky se fija (llegada a la sección), sube la foto del panel 1. */
  private espacioMaybeRevealFirstIntro(
    espacioRect: DOMRect,
    espacioViewportH: number,
  ) {
    if (this.espacioReducedMotion || this.espacioFirstIntroRevealed) return;

    const espacioPinned =
      espacioRect.top <= 0 &&
      espacioRect.bottom >= espacioViewportH * 0.72;
    if (!espacioPinned) return;

    const espacioFirstPanel = this.espacioPanels[0];
    if (!espacioFirstPanel) return;

    this.espacioRevealIntro(espacioFirstPanel);
    this.espacioFirstIntroRevealed = true;
  }

  private espacioReadFrameTranslateY(espacioFrame: HTMLElement) {
    const espacioTransform = getComputedStyle(espacioFrame).transform;
    if (!espacioTransform || espacioTransform === "none") return 0;

    if (espacioTransform.startsWith("matrix3d")) {
      const espacioValues = espacioTransform
        .slice(9, -1)
        .split(",")
        .map(Number.parseFloat);
      return espacioValues[13] ?? 0;
    }

    if (espacioTransform.startsWith("matrix")) {
      const espacioValues = espacioTransform
        .slice(7, -1)
        .split(",")
        .map(Number.parseFloat);
      return espacioValues[5] ?? 0;
    }

    return 0;
  }

  private espacioRevealIntro(espacioPanel: HTMLElement) {
    const espacioFrame = espacioPanel.querySelector<HTMLElement>(
      ".espacio__image-frame",
    );
    if (espacioFrame) {
      const espacioRiseFrom = this.espacioReadFrameTranslateY(espacioFrame);
      espacioPanel.style.setProperty(
        "--espacio-one-rise-from",
        `${Math.max(espacioRiseFrom, 1).toFixed(2)}px`,
      );
      void espacioFrame.offsetWidth;
    }

    this.espacioRevealTitle(espacioPanel);
    this.espacioRevealImage(espacioPanel);
  }

  private espacioRevealImage(espacioPanel: HTMLElement) {
    if (espacioPanel.classList.contains("espacio__panel--image-in")) return;
    espacioPanel.classList.add("espacio__panel--image-in");
  }

  private espacioRevealTitle(espacioPanel: HTMLElement) {
    const espacioTitle = espacioPanel.querySelector<HTMLElement>(".espacio__title");
    if (espacioTitle && !espacioTitle.classList.contains("is-revealed")) {
      espacioTitle.classList.add("is-revealed");
    }
  }
}

function EspacioDesktopSection() {
  const espacioRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const espacioRoot = espacioRef.current;
    if (!espacioRoot) return;

    const mobileMq = window.matchMedia(ESPACIO_MOBILE_MQ);
    if (mobileMq.matches) return;

    const espacioScroll = new EspacioHorizontalScroll(espacioRoot);
    espacioScroll.init();

    const onMqChange = () => {
      if (mobileMq.matches) espacioScroll.destroy();
    };
    mobileMq.addEventListener("change", onMqChange);

    return () => {
      mobileMq.removeEventListener("change", onMqChange);
      espacioScroll.destroy();
    };
  }, []);

  return (
    <section
      ref={espacioRef}
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
                  <div className="espacio__image-stage">
                    <Image
                      src={espacioPanel.image}
                      alt={espacioPanel.imageAlt}
                      fill
                      sizes="100vw"
                      className="espacio__image"
                      quality={75}
                    />
                  </div>
                </figure>

                <div className="espacio__copy">
                  <p className="espacio__eyebrow">{espacioPanel.eyebrow}</p>
                  <h2 className="espacio__title">
                    <span className="espacio__title-reveal">
                      {espacioPanel.title}
                    </span>
                  </h2>
                  <p className="espacio__body">{espacioPanel.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="espacio__edge-fade" aria-hidden={true} />
      </div>
    </section>
  );
}

export function EspacioHorizontalSection() {
  return (
    <div id="espacio">
      <EspacioDesktopSection />
      <EspacioMobileSection />
    </div>
  );
}
