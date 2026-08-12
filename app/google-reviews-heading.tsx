"use client";

import { useTitleReveal } from "@/lib/use-title-reveal";

export function GoogleReviewsHeading() {
  const { ref, displayClassName } = useTitleReveal<HTMLHeadingElement>();

  return (
    <h2
      ref={ref}
      id="google-reviews-heading"
      className={`google-reviews__title ${displayClassName}`}
    >
      <span className="mv-title-reveal">
        Lo que cuentan
        <br aria-hidden="true" />
        las familias
      </span>
    </h2>
  );
}
