"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { fetchWebStoreOrder, WebStoreRequestError } from "@/lib/web-store/api";
import type { WebStoreOrderLookup } from "@/lib/web-store/types";
import {
  WEB_STORE_LAST_CHECKOUT_KEY,
  formatEuroFromCents,
  fulfillmentMethodLabel,
} from "@/lib/web-store/utils";

import { useWebStoreCart } from "../web-store-cart";

function PedidoOkInner() {
  const search = useSearchParams();
  const storeOrderRef = (search.get("storeOrderRef") ?? "").trim();
  const { clear } = useWebStoreCart();
  const [order, setOrder] = useState<WebStoreOrderLookup | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    clear();
  }, [clear]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!storeOrderRef) {
        setStatus("missing");
        return;
      }
      let paymentId = "";
      try {
        const raw = window.sessionStorage.getItem(WEB_STORE_LAST_CHECKOUT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            paymentId?: string;
            storeOrderRef?: string;
          };
          if (parsed.storeOrderRef === storeOrderRef && parsed.paymentId) {
            paymentId = parsed.paymentId;
          }
        }
      } catch {
        /* ignore */
      }

      if (!paymentId) {
        if (!cancelled) setStatus("ok");
        return;
      }

      try {
        const data = await fetchWebStoreOrder(storeOrderRef, paymentId);
        if (cancelled) return;
        setOrder(data);
        setStatus("ok");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof WebStoreRequestError) {
          setStatus("ok");
          return;
        }
        setStatus("ok");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeOrderRef]);

  if (status === "loading") {
    return <p className="tienda-status">Confirmando tu pedido…</p>;
  }

  if (status === "missing" && !storeOrderRef) {
    return (
      <>
        <p className="tienda-eyebrow">The Selection</p>
        <h1 className="tienda-title">Gracias</h1>
        <p className="tienda-status">
          No hemos encontrado la referencia del pedido.{" "}
          <Link href="/tienda" className="tienda-link">
            Volver a la tienda
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <p className="tienda-eyebrow">The Selection</p>
      <h1 className="tienda-title">Pago recibido</h1>
      <p className="tienda-lead">
        Gracias. Hemos recibido tu pago y prepararemos el pedido. Te
        confirmaremos por WhatsApp si hace falta algún detalle.
      </p>
      {storeOrderRef ? (
        <div className="tienda-summary">
          <div className="tienda-summary__row">
            <span>Referencia</span>
            <strong>{storeOrderRef}</strong>
          </div>
          {order ? (
            <>
              <div className="tienda-summary__row">
                <span>Estado</span>
                <span>{order.status}</span>
              </div>
              <div className="tienda-summary__row">
                <span>Entrega</span>
                <span>{fulfillmentMethodLabel(order.fulfillmentMethod)}</span>
              </div>
              <div className="tienda-summary__row tienda-summary__row--total">
                <span>Total</span>
                <strong>{formatEuroFromCents(order.totalCents)}</strong>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
      <div className="tienda-nav-links tienda-actions">
        <Link href="/tienda" className="tienda-btn tienda-btn--solid">
          Seguir en la tienda
        </Link>
        <Link href="/" className="tienda-link">
          Inicio
        </Link>
      </div>
    </>
  );
}

export default function TiendaPedidoOkPage() {
  return (
    <Suspense fallback={<p className="tienda-status">Cargando…</p>}>
      <PedidoOkInner />
    </Suspense>
  );
}
