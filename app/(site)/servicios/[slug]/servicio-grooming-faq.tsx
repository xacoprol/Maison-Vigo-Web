"use client";

import { MvcareFaq } from "@/app/(site)/mvcare/mvcare-faq";
import {
  groomingFaq,
  groomingFaqIntro,
} from "@/lib/grooming-faq";

import "./servicio-grooming-faq.css";

/** FAQ de grooming: reutiliza el acordeón de MV Care. */
export function ServicioGroomingFaq() {
  return (
    <section
      id="grooming-faq"
      className="servicio-grooming-faq"
      aria-labelledby="grooming-faq-heading"
    >
      <div className="servicio-grooming-faq__inner">
        <header className="servicio-grooming-faq__intro">
          <p className="section-label">{groomingFaqIntro.label}</p>
          <h2
            id="grooming-faq-heading"
            className="servicio-grooming-faq__title"
          >
            {groomingFaqIntro.title}
          </h2>
        </header>
        <MvcareFaq items={groomingFaq} />
      </div>
    </section>
  );
}
