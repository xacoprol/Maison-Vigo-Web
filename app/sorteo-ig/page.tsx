import type { Metadata } from "next";

import { SorteoIgClient } from "./sorteo-ig-client";

export const metadata: Metadata = {
  title: "Sorteo Instagram",
  description: "Redirección al sorteo de Maison Vigo en Instagram.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  alternates: {
    canonical: "/sorteo-ig",
  },
};

/**
 * Landing del QR del sorteo IG.
 * No usa redirect 301/302: la visita (con UTMs) y el evento `sorteo_qr_scan`
 * deben registrarse en GA4 antes de salir a Instagram.
 * Fuera de `(site)` para no montar nav/footer/sheets.
 */
export default function SorteoIgPage() {
  return <SorteoIgClient />;
}
