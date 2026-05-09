import type { Metadata } from "next";

import { allowIndexing, siteConfig, siteUrl } from "./site-config";

const stagingRobots = {
  index: false,
  follow: false,
  noarchive: true,
  nosnippet: true,
  noimageindex: true,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
} satisfies Metadata["robots"];

const productionRobots = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
  },
} satisfies Metadata["robots"];

/** Metadata base para `app/layout.tsx`. Las rutas hijas pueden sobreescribir con `export const metadata`. */
export function rootMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteConfig.defaultTitle,
      template: siteConfig.titleTemplate,
    },
    description: siteConfig.defaultDescription,
    applicationName: siteConfig.shortName,
    icons: {
      icon: "/favicon.svg",
    },
    robots: allowIndexing ? productionRobots : stagingRobots,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: siteUrl,
      siteName: siteConfig.shortName,
      title: siteConfig.defaultTitle,
      description: siteConfig.defaultDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: siteConfig.defaultTitle,
      description: siteConfig.defaultDescription,
    },
  };
}
