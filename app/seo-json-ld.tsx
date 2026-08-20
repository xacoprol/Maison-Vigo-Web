import { legalCompany } from "@/lib/legal/company";
import { allowIndexing, siteConfig, siteUrl } from "@/lib/site-config";

/**
 * LocalBusiness global (SSR) — datos alineados con ficha Google / Rich Results.
 * PetGroomingService no es un tipo estándar en schema.org; usamos LocalBusiness.
 */
export function SeoJsonLd() {
  if (!allowIndexing) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteConfig.shortName,
    image: `${siteUrl}/grooming.webp`,
    url: siteUrl,
    telephone: siteConfig.phones.landline,
    priceRange: siteConfig.priceRange,
    address: {
      "@type": "PostalAddress",
      streetAddress: legalCompany.address,
      addressLocality: legalCompany.city,
      addressRegion: legalCompany.province,
      postalCode: legalCompany.postalCode,
      addressCountry: "ES",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "10:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "10:00",
        closes: "14:00",
      },
    ],
    sameAs: [
      siteConfig.social.instagram,
      siteConfig.social.facebook,
      siteConfig.social.tiktok,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
