import type { Metadata } from "next";
import type { ReactNode } from "react";

import { defaultOgImage, siteConfig } from "@/lib/site-config";

import TiendaLayoutClient from "./tienda-layout-client";

const tiendaTitle = "The Selection";
const tiendaDescription =
  "Selección de productos Maison Vigo: cosmética, accesorios y cuidado para llevar a casa.";

export const metadata: Metadata = {
  title: tiendaTitle,
  description: tiendaDescription,
  alternates: { canonical: "/tienda" },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: "/tienda",
    siteName: siteConfig.shortName,
    title: `${tiendaTitle} — ${siteConfig.shortName}`,
    description: tiendaDescription,
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: `${tiendaTitle} — ${siteConfig.shortName}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${tiendaTitle} — ${siteConfig.shortName}`,
    description: tiendaDescription,
    images: [defaultOgImage],
  },
};

export default function TiendaLayout({ children }: { children: ReactNode }) {
  return <TiendaLayoutClient>{children}</TiendaLayoutClient>;
}
