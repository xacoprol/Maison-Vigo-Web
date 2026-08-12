import { legalCompany } from "@/lib/legal/company";
import {
  allowIndexing,
  bookingUrl,
  defaultOgImage,
  siteConfig,
  siteUrl,
} from "@/lib/site-config";

/** JSON-LD (negocio + sitio + reserva) para buscadores y consumo por agentes de IA. */
export function SeoJsonLd() {
  if (!allowIndexing) return null;

  const streetAddress = `${legalCompany.address}, ${legalCompany.postalCode} ${legalCompany.city}, ${legalCompany.province}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["PetGroomer", "LocalBusiness"],
        "@id": `${siteUrl}/#business`,
        name: siteConfig.shortName,
        legalName: legalCompany.legalName,
        description: siteConfig.defaultDescription,
        url: siteUrl,
        image: `${siteUrl}${defaultOgImage}`,
        telephone: [...siteConfig.phones],
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
        openingHoursSpecification: siteConfig.openingHours.map((slot) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [...slot.days],
          opens: slot.opens,
          closes: slot.closes,
        })),
        sameAs: [...siteConfig.sameAs],
        areaServed: {
          "@type": "City",
          name: "Vigo",
        },
        inLanguage: "es",
        priceRange: siteConfig.priceRange,
        knowsAbout: [
          "Peluquería canina",
          "Grooming canino",
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
        // Referencia legible de la dirección completa para consumidores de schema.
        hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(streetAddress)}`,
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
