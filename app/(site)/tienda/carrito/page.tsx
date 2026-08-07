"use client";

import Link from "next/link";

import { formatEuroFromCents, webStoreFileUrl } from "@/lib/web-store/utils";

import { useWebStoreCart } from "../web-store-cart";

export default function TiendaCarritoPage() {
  const { lines, subtotalCents, hydrated, setQuantity, removeLine } =
    useWebStoreCart();

  if (!hydrated) {
    return <p className="tienda-status">Cargando carrito…</p>;
  }

  return (
    <>
      <p className="tienda-eyebrow">The Selection</p>
      <h1 className="tienda-title">Carrito</h1>

      {lines.length === 0 ? (
        <div className="tienda-empty">
          <p className="tienda-status">Tu carrito está vacío.</p>
          <Link href="/tienda" className="tienda-btn tienda-btn--solid">
            Ver The Selection
          </Link>
        </div>
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
                  {line.customization?.texts?.some((t) => t.value) ||
                  line.customization?.photos?.some((p) => p.url) ||
                  line.customization?.quantityTextGroups?.some(
                    (g) => g.quantity > 0,
                  ) ? (
                    <ul className="tienda-cart-row__custom">
                      {line.customization.texts?.map((text, index) =>
                        text.value ? (
                          <li key={`${text.label}-${index}`}>
                            <span className="tienda-cart-row__custom-label">
                              {text.label}:
                            </span>{" "}
                            {text.value}
                          </li>
                        ) : null,
                      )}
                      {line.customization.photos?.map((photo, index) =>
                        photo.url ? (
                          <li
                            key={`photo-${photo.label}-${index}`}
                            className="tienda-cart-row__custom-photo"
                          >
                            <span className="tienda-cart-row__custom-label">
                              {photo.label}:
                            </span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={webStoreFileUrl(photo.url)}
                              alt=""
                            />
                          </li>
                        ) : null,
                      )}
                      {line.customization.quantityTextGroups?.map((group, gi) =>
                        group.quantity > 0 ? (
                          <li key={`qty-${group.label}-${gi}`}>
                            <span className="tienda-cart-row__custom-label">
                              {group.label}:
                            </span>{" "}
                            {group.quantity}
                            {group.texts?.some((t) => t.value) ? (
                              <ul className="tienda-cart-row__custom-nested">
                                {group.texts.map((text, ti) =>
                                  text.value ? (
                                    <li key={`${text.label}-${ti}`}>
                                      {text.label}: {text.value}
                                    </li>
                                  ) : null,
                                )}
                              </ul>
                            ) : null}
                          </li>
                        ) : null,
                      )}
                    </ul>
                  ) : null}
                  <p className="tienda-card__price">
                    {formatEuroFromCents(line.salePriceCents * line.quantity)}
                  </p>
                  {(line.personalizationExtraCents ?? 0) > 0 ? (
                    <p className="tienda-cart-row__unit">
                      {formatEuroFromCents(
                        line.salePriceCents - (line.personalizationExtraCents ?? 0),
                      )}{" "}
                      + {formatEuroFromCents(line.personalizationExtraCents ?? 0)}{" "}
                      pers.
                      {line.quantity > 1 ? " / ud." : ""}
                    </p>
                  ) : line.quantity > 1 ? (
                    <p className="tienda-cart-row__unit">
                      {formatEuroFromCents(line.salePriceCents)} / ud.
                    </p>
                  ) : null}
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
            <p className="tienda-summary__hint">
              Recogida gratis en Maison Vigo. El envío a domicilio se calcula en
              el siguiente paso.
            </p>
          </div>

          <div className="tienda-nav-links tienda-actions">
            <Link href="/tienda" className="tienda-link">
              Seguir comprando
            </Link>
            <Link href="/tienda/checkout" className="tienda-btn tienda-btn--solid">
              Finalizar pedido
            </Link>
          </div>
        </>
      )}
    </>
  );
}
