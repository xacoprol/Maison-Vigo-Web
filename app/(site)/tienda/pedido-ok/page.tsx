"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useMemo, useState } from "react";

import { fetchWebStoreOrder, WebStoreRequestError } from "@/lib/web-store/api";
import type { WebStoreOrderLookup } from "@/lib/web-store/types";
import {
  WEB_STORE_LAST_CHECKOUT_KEY,
  formatEuroFromCents,
  fulfillmentMethodLabel,
  webStoreFileUrl,
} from "@/lib/web-store/utils";

import { useWebStoreCart } from "../web-store-cart";

const PAID_STATUSES = new Set([
  "paid",
  "preparing",
  "ready_for_pickup",
  "shipped",
  "out_for_delivery",
  "completed",
]);

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pendiente de pago",
  payment_failed: "Pago no completado",
  cancelled: "Cancelado",
  paid: "Pedido recibido",
  preparing: "En preparación",
  ready_for_pickup: "Listo para recoger",
  out_for_delivery: "En camino",
  shipped: "Enviado",
  completed: "Completado",
};

type OrderLine = {
  name?: string;
  quantity?: number;
  salePriceCents?: number;
  optionLabel?: string | null;
  imageUrl?: string | null;
};

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function parseLines(raw: unknown[]): OrderLine[] {
  return raw.filter((l): l is OrderLine => l != null && typeof l === "object");
}

function PagoOkHeartIcon() {
  const uid = useId().replace(/:/g, "");
  const fillId = `tienda-pago-heart-fill-${uid}`;
  const sheenId = `tienda-pago-heart-sheen-${uid}`;
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="tienda-pago-ok__heart">
      <defs>
        <linearGradient id={fillId} x1="4" y1="3" x2="18" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f0d78a" />
          <stop offset="55%" stopColor="#e0b85a" />
          <stop offset="100%" stopColor="#bb955d" />
        </linearGradient>
        <linearGradient id={sheenId} x1="8" y1="5" x2="14" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff8e8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff8e8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M12 20.35c-.35 0-.7-.1-1-.3C7.4 17.55 3.5 14.15 3.5 10.1A4.55 4.55 0 0 1 8.05 5.5c1.35 0 2.6.55 3.45 1.5A4.55 4.55 0 0 1 15.95 5.5 4.55 4.55 0 0 1 20.5 10.1c0 4.05-3.9 7.45-7.5 9.95-.3.2-.65.3-1 .3Z"
        fill={`url(#${fillId})`}
      />
      <path
        d="M12 7.85c.55-.7 1.45-1.45 2.7-1.55 1.55-.1 2.85.9 3.15 2.25.15.7.05 1.4-.25 2.05"
        stroke={`url(#${sheenId})`}
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

function PedidoOkInner() {
  const search = useSearchParams();
  const storeOrderRef = (search.get("storeOrderRef") ?? "").trim();
  const { clear } = useWebStoreCart();
  const [order, setOrder] = useState<WebStoreOrderLookup | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    clear();
  }, [clear]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 12;

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

      setStatus("loading");
      try {
        while (!cancelled && attempts < maxAttempts) {
          const data = await fetchWebStoreOrder(storeOrderRef, paymentId);
          if (cancelled) return;
          setOrder(data);
          setStatus("ok");
          if (PAID_STATUSES.has(data.status)) {
            setConfirming(false);
            break;
          }
          if (data.status === "cancelled" || data.status === "payment_failed") {
            setConfirming(false);
            break;
          }
          setConfirming(true);
          attempts += 1;
          if (attempts >= maxAttempts) break;
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (err) {
        if (cancelled) return;
        if (!(err instanceof WebStoreRequestError)) {
          /* still show thanks shell */
        }
        setStatus("ok");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storeOrderRef]);

  const paid = order ? PAID_STATUSES.has(order.status) : Boolean(storeOrderRef);
  const lines = useMemo(
    () => (order ? parseLines(order.lines) : []),
    [order],
  );

  if (status === "loading") {
    return (
      <div className="tienda-pago-ok">
        <p className="tienda-pago-ok__status">Confirmando tu pago…</p>
      </div>
    );
  }

  if (status === "missing" && !storeOrderRef) {
    return (
      <div className="tienda-pago-ok">
        <p className="tienda-pago-ok__eyebrow">The Selection</p>
        <h1 className="tienda-pago-ok__title">Gracias</h1>
        <p className="tienda-pago-ok__lead">
          No hemos encontrado la referencia del pedido.
        </p>
        <div className="tienda-pago-ok__actions">
          <Link href="/tienda" className="tienda-btn tienda-btn--solid">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tienda-pago-ok">
      <div
        className={
          "tienda-pago-ok__icon" +
          (paid ? " tienda-pago-ok__icon--paid" : "")
        }
      >
        {paid ? (
          <PagoOkHeartIcon />
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="tienda-pago-ok__pending"
            aria-hidden
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="1.25"
              className="tienda-pago-ok__pending-ring"
            />
            <path
              d="M12 7v5l3 2"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <p className="tienda-pago-ok__eyebrow">
        {paid ? "Pedido confirmado" : "Confirmando pago"}
      </p>
      <h1 className="tienda-pago-ok__title">
        {paid ? "¡Gracias!" : "Pago en proceso"}
      </h1>
      <p className="tienda-pago-ok__lead">
        {paid ? (
          <>
            Hemos registrado tu pago. Este es el resumen de tu pedido; te
            confirmaremos por WhatsApp si hace falta algún detalle.
          </>
        ) : confirming ? (
          <>
            Estamos confirmando el pago con el banco. Si tarda, la referencia
            del pedido te permitirá consultarlo más adelante.
          </>
        ) : (
          <>
            Gracias. Si el banco confirma la operación, el estado se actualizará
            en breve.
          </>
        )}
      </p>

      {confirming && !paid ? (
        <div className="tienda-pago-ok__bar" aria-hidden>
          <span className="tienda-pago-ok__bar-fill" />
        </div>
      ) : null}

      {storeOrderRef ? (
        <div className="tienda-pago-ok__card">
          <div className="tienda-pago-ok__meta">
            <div className="tienda-pago-ok__meta-row">
              <span>Referencia</span>
              <strong>{storeOrderRef}</strong>
            </div>
            {order ? (
              <>
                <div className="tienda-pago-ok__meta-row">
                  <span>Estado</span>
                  <span>{statusLabel(order.status)}</span>
                </div>
                <div className="tienda-pago-ok__meta-row">
                  <span>Entrega</span>
                  <span>{fulfillmentMethodLabel(order.fulfillmentMethod)}</span>
                </div>
              </>
            ) : null}
          </div>

          {lines.length > 0 ? (
            <ul className="tienda-pago-ok__lines">
              {lines.map((line, i) => {
                const img = webStoreFileUrl(line.imageUrl);
                const qty = Math.max(1, Math.round(Number(line.quantity) || 1));
                const price = Number(line.salePriceCents) || 0;
                return (
                  <li key={`${line.name ?? "line"}-${i}`} className="tienda-pago-ok__line">
                    <div className="tienda-pago-ok__thumb" aria-hidden>
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" />
                      ) : (
                        <span>◇</span>
                      )}
                    </div>
                    <div className="tienda-pago-ok__line-copy">
                      <p className="tienda-pago-ok__line-name">
                        {String(line.name ?? "").trim() || "Producto"}
                      </p>
                      {line.optionLabel ? (
                        <p className="tienda-pago-ok__line-opt">{line.optionLabel}</p>
                      ) : null}
                      <p className="tienda-pago-ok__line-qty">
                        {qty} × {formatEuroFromCents(price)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {order ? (
            <div className="tienda-pago-ok__totals">
              {order.shippingCents > 0 ? (
                <div className="tienda-pago-ok__total-row">
                  <span>Envío</span>
                  <span>{formatEuroFromCents(order.shippingCents)}</span>
                </div>
              ) : null}
              <div className="tienda-pago-ok__total-row tienda-pago-ok__total-row--grand">
                <span>Total</span>
                <strong>{formatEuroFromCents(order.totalCents)}</strong>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="tienda-pago-ok__actions">
        <Link href="/tienda" className="tienda-btn">
          Seguir en la tienda
        </Link>
        <Link href="/" className="tienda-btn tienda-btn--cream">
          Inicio
        </Link>
      </div>
    </div>
  );
}

export default function TiendaPedidoOkPage() {
  return (
    <Suspense
      fallback={
        <div className="tienda-pago-ok">
          <p className="tienda-pago-ok__status">Cargando…</p>
        </div>
      }
    >
      <PedidoOkInner />
    </Suspense>
  );
}
