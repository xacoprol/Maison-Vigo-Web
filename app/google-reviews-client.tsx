"use client";

import { useEffect, useRef, useState } from "react";

import {
  formatGoogleRating,
  formatGoogleReviewCount,
  type GooglePlaceReview,
  type GooglePlaceReviewsPayload,
} from "@/lib/google-places-reviews";
import { useTitleReveal } from "@/lib/use-title-reveal";

function StarRow({ rating }: { rating: number }) {
  const filled = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <span
      className="google-reviews__stars"
      aria-label={`${filled} de 5 estrellas`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={
            "google-reviews__star" +
            (i < filled ? " google-reviews__star--on" : "")
          }
          aria-hidden={true}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: GooglePlaceReview }) {
  const body = (
    <>
      <img
        src="/assets/images/iconos/quotes.svg"
        alt=""
        width={28}
        height={24}
        className="google-reviews__quote-mark"
      />
      <StarRow rating={review.rating} />
      <p className="google-reviews__text">{review.text}</p>
      <footer className="google-reviews__meta">
        <span className="google-reviews__author">{review.authorName}</span>
        {review.relativeTime ? (
          <span className="google-reviews__time">{review.relativeTime}</span>
        ) : null}
      </footer>
    </>
  );

  if (review.reviewUri) {
    return (
      <a
        className="google-reviews__card google-reviews__card--link"
        href={review.reviewUri}
        target="_blank"
        rel="noopener noreferrer"
      >
        {body}
      </a>
    );
  }

  return <article className="google-reviews__card">{body}</article>;
}

export function GoogleReviewsClient({
  data,
}: {
  data: GooglePlaceReviewsPayload;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const footerRef = useRef<HTMLDivElement>(null);
  const { ref: titleRef, displayClassName } =
    useTitleReveal<HTMLHeadingElement>();

  const [headerInView, setHeaderInView] = useState(false);
  const [visibleSlides, setVisibleSlides] = useState<Record<number, boolean>>(
    {},
  );
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setHeaderInView(true);
      setFooterVisible(true);
      const all: Record<number, boolean> = {};
      data.reviews.forEach((_, i) => {
        all[i] = true;
      });
      setVisibleSlides(all);
      return;
    }

    const headerObs = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setHeaderInView(true);
        headerObs.disconnect();
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    headerObs.observe(section);

    return () => headerObs.disconnect();
  }, [data.reviews]);

  useEffect(() => {
    const nodes = slideRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!nodes.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = nodes.indexOf(entry.target as HTMLDivElement);
          if (index < 0) continue;
          setVisibleSlides((prev) =>
            prev[index] ? prev : { ...prev, [index]: true },
          );
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -4% 0px" },
    );

    nodes.forEach((node) => obs.observe(node));
    return () => obs.disconnect();
  }, [data.reviews]);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setFooterVisible(true);
        obs.disconnect();
      },
      { threshold: 0.35 },
    );
    obs.observe(footer);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="opiniones"
      className={
        "google-reviews" + (headerInView ? " google-reviews--inview" : "")
      }
      aria-labelledby="google-reviews-heading"
    >
      <div className="google-reviews__inner">
        <header className="google-reviews__header">
          <p
            className={
              "google-reviews__kicker" +
              (headerInView ? " google-reviews__kicker--visible" : "")
            }
          >
            Opiniones en Google
          </p>
          <h2
            ref={titleRef}
            id="google-reviews-heading"
            className={`google-reviews__title ${displayClassName}`}
          >
            <span className="mv-title-reveal">
              Lo que cuentan
              <br aria-hidden="true" />
              las familias
            </span>
          </h2>
          <div
            className={
              "google-reviews__score" +
              (headerInView ? " google-reviews__score--visible" : "")
            }
          >
            <p className="google-reviews__score-value">
              {formatGoogleRating(data.rating)}
            </p>
            <div className="google-reviews__score-copy">
              <StarRow rating={data.rating} />
              <p className="google-reviews__score-count">
                {formatGoogleReviewCount(data.userRatingCount)} opiniones en
                Google
              </p>
            </div>
          </div>
        </header>

        <div
          className="google-reviews__track"
          role="list"
          aria-label="Reseñas de Google"
        >
          {data.reviews.map((review, i) => (
            <div
              key={`${review.authorName}-${review.relativeTime}`}
              ref={(node) => {
                slideRefs.current[i] = node;
              }}
              className={
                "google-reviews__slide" +
                (visibleSlides[i] ? " google-reviews__slide--visible" : "")
              }
              role="listitem"
            >
              <ReviewCard review={review} />
            </div>
          ))}
        </div>

        <div
          ref={footerRef}
          className={
            "google-reviews__footer" +
            (footerVisible ? " google-reviews__footer--visible" : "")
          }
        >
          <a
            className="google-reviews__cta"
            href={data.mapsUri}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver todas en Google
            <img
              src="/assets/images/iconos/arrow-top-right.svg"
              alt=""
              width={14}
              height={14}
              className="google-reviews__cta-icon"
            />
          </a>
          <p className="google-reviews__attribution">
            Reseñas de Google Maps · {data.placeName}
          </p>
        </div>
      </div>
    </section>
  );
}
