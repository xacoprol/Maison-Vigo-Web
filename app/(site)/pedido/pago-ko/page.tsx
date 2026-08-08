import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { TiendaLogoLoader } from "../tienda/tienda-logo-loader";
import { PagoKoClient } from "./pago-ko-client";

import "../../tienda/tienda.css";

export const metadata: Metadata = {
  title: "Pago no completado",
  robots: { index: false, follow: false },
};

export default function PedidoPagoKoPage() {
  return (
    <div className="tienda-page">
      <div className="tienda-page__inner">
        <p className="tienda-eyebrow">Pedido</p>
        <h1 className="tienda-title">Pago no completado</h1>
        <p className="tienda-lead">
          El cobro no se ha confirmado. Puedes volver al carrito e intentarlo de
          nuevo, o escribirnos si necesitas ayuda.
        </p>
        <Suspense
          fallback={
            <TiendaLogoLoader
              message="Cargando…"
              className="tienda-logo-loader--compact"
            />
          }
        >
          <PagoKoClient />
        </Suspense>
        <div className="tienda-nav-links" style={{ marginTop: 24 }}>
          <Link href="/tienda/carrito" className="tienda-btn tienda-btn--solid">
            Volver al carrito
          </Link>
          <Link href="/tienda" className="tienda-link">
            Catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
