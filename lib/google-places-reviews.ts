import { siteUrl } from "@/lib/site-config";

export type GooglePlaceReview = {
  authorName: string;
  authorUri: string | null;
  rating: number;
  text: string;
  relativeTime: string | null;
  reviewUri: string | null;
};

export type GooglePlaceReviewsPayload = {
  placeName: string;
  rating: number;
  userRatingCount: number;
  mapsUri: string;
  reviews: GooglePlaceReview[];
};

type PlacesApiReview = {
  rating?: number;
  relativePublishTimeDescription?: string;
  googleMapsUri?: string;
  text?: { text?: string };
  authorAttribution?: {
    displayName?: string;
    uri?: string;
  };
};

type PlacesApiPlace = {
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlacesApiReview[];
};

const REVALIDATE_SECONDS = 60 * 60 * 24; // 24 h
/** Cuántas citas mostramos en home (Places nunca da más de 5). */
const MAX_REVIEWS = 5;
const MIN_REVIEW_CHARS = 40;

function truncateReviewText(text: string, max = 280): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  const slice = normalized.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return `${(lastSpace > 120 ? slice.slice(0, lastSpace) : slice).trim()}…`;
}

/**
 * Reseñas públicas vía Places API (New). Máximo 5 por diseño de Google.
 * La key debe vivir solo en servidor. Si la key tiene restricción HTTP referrer,
 * enviamos el origen del sitio (comportamiento habitual con keys de Maps web).
 */
export async function getGooglePlaceReviews(): Promise<GooglePlaceReviewsPayload | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  const placeId = process.env.GOOGLE_PLACE_ID?.trim();
  if (!apiKey || !placeId) return null;

  const referer =
    process.env.GOOGLE_PLACES_HTTP_REFERER?.trim() || `${siteUrl}/`;

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=es`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "id,displayName,rating,userRatingCount,reviews,googleMapsUri",
          Referer: referer,
        },
        next: { revalidate: REVALIDATE_SECONDS },
      },
    );

    if (!res.ok) {
      console.error(
        "[google-places] Place Details failed:",
        res.status,
        await res.text().catch(() => ""),
      );
      return null;
    }

    const data = (await res.json()) as PlacesApiPlace;
    const rating = typeof data.rating === "number" ? data.rating : null;
    const userRatingCount =
      typeof data.userRatingCount === "number" ? data.userRatingCount : null;
    const mapsUri =
      typeof data.googleMapsUri === "string" && data.googleMapsUri
        ? data.googleMapsUri
        : `https://www.google.com/maps/place/?q=place_id:${placeId}`;

    if (rating == null || userRatingCount == null) return null;

    const reviews = (data.reviews ?? [])
      .map((review): GooglePlaceReview | null => {
        const text = review.text?.text?.trim() ?? "";
        const authorName = review.authorAttribution?.displayName?.trim() ?? "";
        const reviewRating =
          typeof review.rating === "number" ? review.rating : 0;
        if (!authorName || text.length < MIN_REVIEW_CHARS || reviewRating < 4) {
          return null;
        }
        return {
          authorName,
          authorUri: review.authorAttribution?.uri ?? null,
          rating: reviewRating,
          text: truncateReviewText(text),
          relativeTime: review.relativePublishTimeDescription ?? null,
          reviewUri: review.googleMapsUri ?? null,
        };
      })
      .filter((r): r is GooglePlaceReview => r != null)
      .slice(0, MAX_REVIEWS);

    if (!reviews.length) return null;

    return {
      placeName: data.displayName?.text?.trim() || "Maison Vigo",
      rating,
      userRatingCount,
      mapsUri,
      reviews,
    };
  } catch (error) {
    console.error("[google-places] unexpected error:", error);
    return null;
  }
}

export function formatGoogleRating(rating: number): string {
  return rating.toLocaleString("es-ES", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatGoogleReviewCount(count: number): string {
  return count.toLocaleString("es-ES");
}
