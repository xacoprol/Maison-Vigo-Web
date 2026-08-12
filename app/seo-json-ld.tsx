import { legalCompany } from "@/lib/legal/company";
import {
  allowIndexing,
  bookingUrl,
  businessImage,
  siteConfig,
  siteUrl,
} from "@/lib/site-config";

/** JSON-LD (negocio + sitio + reserva) para buscadores y consumo por agentes de IA. */
export function SeoJsonLd() {
  if (!allowIndexing) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "PetGroomer"],
        "@id": `${siteUrl}/#business`,
        name: siteConfig.shortName,
        legalName: legalCompany.legalName,
        description: siteConfig.defaultDescription,
        url: siteUrl,
        image: `${siteUrl}${businessImage}`,
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
        geo: {
          "@type": "GeoCoordinates",
          latitude: siteConfig.geo.latitude,
          longitude: siteConfig.geo.longitude,
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
            ],
            opens: "10:00",
            closes: "18:00",
          },
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: "Saturday",
            opens: "10:00",
            closes: "14:00",
          },
        ],
        sameAs: [
          siteConfig.social.instagram,
          siteConfig.social.facebook,
          siteConfig.social.tiktok,
        ],
        areaServed: {
          "@type": "City",
          name: "Vigo",
        },
        inLanguage: "es",
        knowsAbout: [
          "Peluquería canina en Vigo",
          "Grooming canino",
          "Estética canina",
          "Bienestar animal",
          "Guardería para perros",
          "Educación canina",
        ],
        potentialAction: {
          "@type": "ReserveAction",
          name: "Reservar cita",
          target: {
            "@type": "EntryPoint",
            urlTemplate: bookingUrl,
          },
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteConfig.shortName,
        description: siteConfig.defaultDescription,
        inLanguage: "es",
        publisher: { "@id": `${siteUrl}/#business` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
