import type { MetadataRoute } from "next";

import { servicioSlugs } from "@/lib/servicios-data";
import { allowIndexing, siteUrl } from "@/lib/site-config";

/** Amplía esta lista cuando añadas páginas indexables. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!allowIndexing) return [];

  const now = new Date();
  const servicios = servicioSlugs.map((slug) => ({
    url: `${siteUrl}/servicios/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...servicios,
    {
      url: `${siteUrl}/mvcare`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${siteUrl}/cookies`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/aviso-legal`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.25,
    },
    {
      url: `${siteUrl}/privacidad`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.25,
    },
    {
      url: `${siteUrl}/condiciones-generales`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.25,
    },
    {
      url: `${siteUrl}/politica-reservas`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.25,
    },
  ];
}
