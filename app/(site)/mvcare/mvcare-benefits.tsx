"use client";

import { useEffect, useRef } from "react";

import { mvcareBenefitsCol1, mvcareBenefitsCol2 } from "@/lib/mvcare-content";

const DESKTOP_MIN = 1024;
/** Ref. `experienceCard`: ±vh según progreso de `.section` (no solo sticky). */
const CARD_PARALLAX_VH = 12;
const COL2_CARD_FACTOR = 0.55;
/** Ref. `imageScaleInSmall` + `imageMove`. */
const BG_SCALE_END = 1.08;
const BG_MOVE_VH = 10;

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

    const cards = () =>
      cardsGrid.querySelectorAll<HTMLLIElement>(".mvcare-benefits__card");

    const clearTransforms = () => {
      bg.style.transform = "";
      bg.style.transformOrigin = "";
      cards().forEach((card) => {
        card.style.transform = "";
      });
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
      const cardOffsetVh = (0.5 - progress) * 2 * CARD_PARALLAX_VH;

      const bgStage = bg.parentElement;
      const stageH = bgStage?.clientHeight ?? vh;
      const bgH = bg.offsetHeight || stageH;
      const moveRatio = stageH > 0 ? (stageH - bgH) / stageH : 0;
      const bgMoveY = -progress * moveRatio * stageH;

      bg.style.transformOrigin = "left bottom";
      bg.style.transform = `translate3d(0, ${bgMoveY}px, 0) scale(${1 + progress * (BG_SCALE_END - 1)})`;

      cards().forEach((card) => {
        const factor = card.closest(".mvcare-benefits__col--2")
          ? COL2_CARD_FACTOR
          : 1;
        const y = (cardOffsetVh * factor * vh) / 100;
        card.style.transform = `translate3d(0, ${y}px, 0)`;
      });

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
                  src="/assets/images/lo-que-ganas-con-mvcare.webp"
                  alt=""
                  width={1327}
                  height={1733}
                  decoding="async"
                  draggable={false}
                />
              </div>
            </div>
          </div>

          <div className="mvcare-benefits__layer mvcare-benefits__layer--title">
            <div className="mvcare-benefits__title-wrap">
              <p className="section-label mvcare-reveal">Beneficios</p>
              <h2
                id="mvcare-benefits-title"
                className="section-title mvcare-benefits__title mvcare-reveal"
              >
                Lo que ganas con MV Care
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
