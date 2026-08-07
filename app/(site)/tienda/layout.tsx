import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./tienda.css";

export const metadata: Metadata = {
  title: "The Selection",
  description:
    "Selección de productos Maison Vigo: cosmética, accesorios y cuidado para llevar a casa.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TiendaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="tienda-page">
      <div className="tienda-page__inner">{children}</div>
    </div>
  );
}
