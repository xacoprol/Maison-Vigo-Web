import { getGooglePlaceReviews } from "@/lib/google-places-reviews";

import { GoogleReviewsClient } from "./google-reviews-client";
import "./google-reviews-section.css";

/** Reseñas de Google Places (server) — se oculta si no hay datos / key. */
export async function GoogleReviewsSection() {
  const data = await getGooglePlaceReviews();
  if (!data) return null;
  return <GoogleReviewsClient data={data} />;
}
