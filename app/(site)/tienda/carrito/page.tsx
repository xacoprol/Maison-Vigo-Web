"use client";

import Link from "next/link";

import { formatEuroFromCents } from "@/lib/web-store/utils";

import { useWebStoreCart } from "../web-store-cart";

export default function TiendaCarritoPage() {
  const { lines, subtotalCents, hydrated, setQuantity, removeLine } =
    useWebStoreCart();

  if (!hydrated) {
    return <p className="tienda-status">Cargando carrito…</p>;
  }

  return (
    <>
      <p className="tienda-eyebrow">Pedido</p>
      <h1 className="tienda-title">Carrito</h1>

      {lines.length === 0 ? (
        <p className="tienda-status">
          Tu carrito está vacío.{" "}
          <Link href="/tienda" className="tienda-link">
            Volver al catálogo
          </Link>
        </p>
      ) : (
        <>
          <div className="tienda-cart-list">
            {lines.map((line) => (
              <article key={line.lineId} className="tienda-cart-row">
                <div className="tienda-cart-row__media">
                  {line.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.imageUrl} alt="" />
                  ) : null}
                </div>
                <div className="tienda-cart-row__meta">
                  <h2 className="tienda-cart-row__name">{line.name}</h2>
                  {line.optionLabel ? (
                    <p className="tienda-cart-row__opt">{line.optionLabel}</p>
                  ) : null}
                  <p className="tienda-card__price">
                    {formatEuroFromCents(line.salePriceCents)}
                  </p>
                </div>
                <div className="tienda-cart-row__side">
                  <div className="tienda-qty">
                    <button
                      type="button"
                      aria-label="Restar"
                      onClick={() => setQuantity(line.lineId, line.quantity - 1)}
                    >
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      type="button"
                      aria-label="Sumar"
                      onClick={() => setQuantity(line.lineId, line.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="tienda-link"
                    onClick={() => removeLine(line.lineId)}
                  >
                    Quitar
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="tienda-summary">
            <div className="tienda-summary__row tienda-summary__row--total">
              <span>Subtotal</span>
              <strong>{formatEuroFromCents(subtotalCents)}</strong>
            </div>
          </div>

          <div className="tienda-nav-links">
            <Link href="/tienda" className="tienda-link">
              Seguir comprando
            </Link>
            <Link href="/tienda/checkout" className="tienda-btn tienda-btn--solid">
              Ir al checkout
            </Link>
          </div>
        </>
      )}
    </>
  );
}
