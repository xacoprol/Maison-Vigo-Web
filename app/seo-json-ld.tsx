import { allowIndexing, bookingUrl, siteConfig, siteUrl } from "@/lib/site-config";

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
        description: siteConfig.defaultDescription,
        url: siteUrl,
        areaServed: {
          "@type": "City",
          name: "Vigo",
        },
        inLanguage: "es",
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
