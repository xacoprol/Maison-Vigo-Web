"use client";

import { useEffect, useRef } from "react";

import { mvcareBenefitsCol1, mvcareBenefitsCol2 } from "@/lib/mvcare-content";

const PARALLAX_SLOW = 0.6;
const DESKTOP_MIN = 1024;

export function MvcareBenefits() {
  const sectionRef = useRef<HTMLElement>(null);
  const col2Ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const col2 = col2Ref.current;
    if (!section || !col2) return;

    const mq = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const clearTransform = () => {
      col2.style.transform = "";
    };

    const update = () => {
      if (!mq.matches || reducedMotion) {
        clearTransform();
        return;
      }

      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;

      if (rect.bottom < 0 || rect.top > vh) {
        clearTransform();
        return;
      }

      const traveled = Math.max(0, vh * 0.15 - rect.top);
      const offset = traveled * (1 - PARALLAX_SLOW);
      col2.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    };

    update();
    window.addEventListener("mv-scroll", update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    mq.addEventListener("change", update);

    return () => {
      window.removeEventListener("mv-scroll", update);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", update);
      clearTransform();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="mvcare-section mvcare-section--cream mvcare-benefits"
      aria-labelledby="mvcare-benefits-title"
    >
      <div className="mvcare-section__inner mvcare-benefits__layout">
        <div className="mvcare-benefits__sticky mvcare-reveal">
          <p className="section-label">Beneficios</p>
          <h2
            id="mvcare-benefits-title"
            className="section-title mvcare-benefits__title"
          >
            Lo que ganas con MV Care
          </h2>
        </div>

        <div className="mvcare-benefits__scroll">
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
              ref={col2Ref}
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
    </section>
  );
}
