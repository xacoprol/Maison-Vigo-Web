import {
  formatGoogleRating,
  formatGoogleReviewCount,
  getGooglePlaceReviews,
  type GooglePlaceReview,
} from "@/lib/google-places-reviews";

import { GoogleReviewsHeading } from "./google-reviews-heading";
import "./google-reviews-section.css";

function StarRow({ rating }: { rating: number }) {
  const filled = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <span className="google-reviews__stars" aria-label={`${filled} de 5 estrellas`}>
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

/** Reseñas de Google Places (server) — se oculta si no hay datos / key. */
export async function GoogleReviewsSection() {
  const data = await getGooglePlaceReviews();
  if (!data) return null;

  return (
    <section
      id="opiniones"
      className="google-reviews"
      aria-labelledby="google-reviews-heading"
    >
      <div className="google-reviews__inner">
        <header className="google-reviews__header">
          <p className="google-reviews__kicker">Opiniones en Google</p>
          <GoogleReviewsHeading />
          <div className="google-reviews__score">
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
          {data.reviews.map((review) => (
            <div
              key={`${review.authorName}-${review.relativeTime}`}
              className="google-reviews__slide"
              role="listitem"
            >
              <ReviewCard review={review} />
            </div>
          ))}
        </div>

        <div className="google-reviews__footer">
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
