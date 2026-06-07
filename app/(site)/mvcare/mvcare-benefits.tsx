"use client";

import { useEffect, useRef } from "react";

import { mvcareBenefits, mvcareBenefitsCol1, mvcareBenefitsCol2, mvcareBenefitsSection } from "@/lib/mvcare-content";

const DESKTOP_MIN = 900;
/**
 * Ref. Grigoriak `experienceCard`: col.1 = 25vh, col.2 = 35vh (`data-parallax-size`).
 * Misma curva: +(size)vh al entrar la sección → −(size)vh al salir.
 */
const COL1_PARALLAX_VH = 25;
const COL2_PARALLAX_VH = 35;
/** Ref. `imageScaleInSmall` + `imageMove`. */
const BG_SCALE_END = 1.12;
const BG_MOVE_MULTIPLIER = 1.32;

function sectionProgress(section: HTMLElement, vh: number) {
  const range = section.offsetHeight + vh;
  if (range <= 0) return 0;
  const rect = section.getBoundingClientRect();
  return Math.min(Math.max((vh - rect.top) / range, 0), 1);
}

export function MvcareBenefits() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const cardsGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const bg = bgRef.current;
    const cardsGrid = cardsGridRef.current;

    if (!wrap || !section || !sticky || !bg || !cardsGrid) return;

    const desktopMq = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!desktopMq.matches || reducedMotion) {
      wrap.classList.add("mvcare-benefits-wrap--static");
      return;
    }

    const cols = () => ({
      col1: cardsGrid.querySelector<HTMLUListElement>(".mvcare-benefits__col--1"),
      col2: cardsGrid.querySelector<HTMLUListElement>(".mvcare-benefits__col--2"),
    });

    const clearTransforms = () => {
      bg.style.transform = "";
      bg.style.transformOrigin = "";
      const { col1, col2 } = cols();
      if (col1) col1.style.transform = "";
      if (col2) col2.style.transform = "";
      cardsGrid.style.removeProperty("padding-bottom");
      wrap.classList.remove("mvcare-benefits-wrap--complete");
    };

    const measureEndPadding = () => {
      const gutter = Number.parseFloat(
        getComputedStyle(wrap).getPropertyValue("--mvcare-benefits-gutter"),
      );
      const safeGutter = Number.isFinite(gutter) ? gutter : 32;
      cardsGrid.style.paddingBottom = `${safeGutter}px`;
    };

    const update = () => {
      const vh = window.innerHeight;
      const progress = sectionProgress(section, vh);
      const parallaxY = (sizeVh: number) =>
        ((0.5 - progress) * 2 * sizeVh * vh) / 100;

      const bgStage = bg.parentElement;
      const stageH = bgStage?.clientHeight ?? vh;
      const bgH = bg.offsetHeight || stageH;
      const moveRatio = stageH > 0 ? Math.max(0, (stageH - bgH) / stageH) : 0;
      const bgMoveY = -progress * moveRatio * stageH * BG_MOVE_MULTIPLIER;

      bg.style.transformOrigin = "left bottom";
      bg.style.transform = `translate3d(0, ${bgMoveY}px, 0) scale(${1 + progress * (BG_SCALE_END - 1)})`;

      const { col1, col2 } = cols();
      if (col1) {
        col1.style.transform = `translate3d(0, ${parallaxY(COL1_PARALLAX_VH)}px, 0)`;
      }
      if (col2) {
        col2.style.transform = `translate3d(0, ${parallaxY(COL2_PARALLAX_VH)}px, 0)`;
      }

      const stickyRect = sticky.getBoundingClientRect();
      const travel = Math.max(sticky.offsetHeight - vh, 0);
      const stickyProgress =
        travel > 0
          ? Math.min(Math.max(-stickyRect.top / travel, 0), 1)
          : progress;

      wrap.classList.toggle(
        "mvcare-benefits-wrap--complete",
        stickyProgress >= 0.999,
      );
    };

    const onScroll = () => update();
    const onResize = () => {
      measureEndPadding();
      update();
    };

    window.addEventListener("mv-scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    desktopMq.addEventListener("change", onResize);
    measureEndPadding();
    update();

    return () => {
      window.removeEventListener("mv-scroll", onScroll);
      window.removeEventListener("resize", onResize);
      desktopMq.removeEventListener("change", onResize);
      clearTransforms();
      wrap.classList.remove("mvcare-benefits-wrap--static");
    };
  }, []);

  return (
    <div ref={wrapRef} className="mvcare-benefits-wrap">
      <section
        ref={sectionRef}
        className="mvcare-section mvcare-section--dark mvcare-benefits"
        aria-labelledby="mvcare-benefits-title"
      >
        <div
          ref={stickyRef}
          id="mvcare-benefits-sticky"
          className="mvcare-benefits__sticky"
        >
          <div
            className="mvcare-benefits__layer mvcare-benefits__layer--bg"
            aria-hidden="true"
          >
            <div className="mvcare-benefits__bg-stage">
              <div ref={bgRef} className="mvcare-benefits__bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="mvcare-benefits__bg-img"
                  src="/assets/images/galgo.webp"
                  alt=""
                  width={4055}
                  height={4216}
                  decoding="async"
                  draggable={false}
                />
              </div>
            </div>
          </div>

          <div className="mvcare-benefits__layer mvcare-benefits__layer--title">
            <div className="mvcare-benefits__title-wrap">
              <h2
                id="mvcare-benefits-title"
                className="section-title mvcare-benefits__title mvcare-reveal"
              >
                <span className="mvcare-benefits__title-lead">
                  {mvcareBenefitsSection.titleBefore}
                </span>{" "}
                <span className="mvcare-benefits__title-brand">
                  {mvcareBenefitsSection.titleBrand}
                </span>
              </h2>
            </div>
          </div>

          <div className="mvcare-benefits__layer mvcare-benefits__layer--list">
            <div ref={cardsGridRef} className="mvcare-benefits__list">
              <div className="mvcare-benefits__columns">
                <ul
                  className="mvcare-benefits__col mvcare-benefits__col--1"
                  role="list"
                >
                  {mvcareBenefitsCol1.map((benefit) => (
                    <li key={benefit} className="mvcare-benefits__card">
                      <p className="mvcare-benefits__card-text">{benefit}</p>
                    </li>
                  ))}
                </ul>
                <ul
                  className="mvcare-benefits__col mvcare-benefits__col--2"
                  role="list"
                >
                  {mvcareBenefitsCol2.map((benefit) => (
                    <li key={benefit} className="mvcare-benefits__card">
                      <p className="mvcare-benefits__card-text">{benefit}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <ul
                className="mvcare-benefits__carousel"
                role="list"
                aria-label="Beneficios de MV Care"
              >
                {mvcareBenefits.map((benefit) => (
                  <li key={benefit} className="mvcare-benefits__carousel-card">
                    <p className="mvcare-benefits__card-text">{benefit}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
