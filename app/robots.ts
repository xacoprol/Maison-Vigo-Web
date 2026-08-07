import type { MetadataRoute } from "next";

import { allowIndexing, siteUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  if (!allowIndexing) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/mantenimiento",
        "/tienda/carrito",
        "/tienda/checkout",
        "/tienda/pedido-ok",
        "/pedido/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
