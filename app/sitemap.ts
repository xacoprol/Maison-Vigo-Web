import type { MetadataRoute } from "next";

import { allowIndexing, siteUrl } from "@/lib/site-config";

/** Amplía esta lista cuando añadas páginas indexables. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!allowIndexing) return [];

  const now = new Date();
  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/cookies`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
