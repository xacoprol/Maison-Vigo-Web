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

  const telephone = `+34${legalCompany.phone.replace(/\s/g, "")}`;

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
        image: `${siteUrl}${defaultOgImage}`,
        telephone,
        address: {
          "@type": "PostalAddress",
          streetAddress: legalCompany.address,
          addressLocality: legalCompany.city,
          addressRegion: legalCompany.province,
          postalCode: legalCompany.postalCode,
          addressCountry: "ES",
        },
        areaServed: {
          "@type": "City",
          name: "Vigo",
        },
        inLanguage: "es",
        priceRange: "€€",
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
