import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { WebStoreCartProvider } from "./web-store-cart";
import { TiendaCartBadge } from "./tienda-cart-badge";

import "./tienda.css";

export const metadata: Metadata = {
  title: "Tienda",
  description:
    "Selección de productos Maison Vigo: cosmética, accesorios y cuidado para llevar a casa.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TiendaLayout({ children }: { children: ReactNode }) {
  return (
    <WebStoreCartProvider>
      <div className="tienda-page">
        <div className="tienda-page__inner">
          <div className="tienda-toolbar">
            <nav className="tienda-nav-links" aria-label="Tienda">
              <Link href="/tienda" className="tienda-link">
                Catálogo
              </Link>
              <Link href="/tienda/carrito" className="tienda-link">
                Carrito
                <TiendaCartBadge />
              </Link>
              <Link href="/tienda/checkout" className="tienda-link">
                Checkout
              </Link>
            </nav>
            <Link href="/" className="tienda-link">
              Maison Vigo
            </Link>
          </div>
          {children}
        </div>
      </div>
    </WebStoreCartProvider>
  );
}
