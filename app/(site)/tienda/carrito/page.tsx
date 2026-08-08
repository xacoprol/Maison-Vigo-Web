"use client";

import Link from "next/link";

import { formatEuroFromCents, webStoreFileUrl } from "@/lib/web-store/utils";

import { TiendaLogoLoader } from "../tienda-logo-loader";
import { useWebStoreCart } from "../web-store-cart";

export default function TiendaCarritoPage() {
  const { lines, subtotalCents, hydrated, setQuantity, removeLine } =
    useWebStoreCart();

  if (!hydrated) {
    return <TiendaLogoLoader message="Cargando carrito…" />;
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
          <ul className="tienda-cart-list">
            {lines.map((line) => {
              const lineTotal = line.salePriceCents * line.quantity;
              const extra = line.personalizationExtraCents ?? 0;
              return (
                <li key={line.lineId} className="tienda-cart-row">
                  <div className="tienda-cart-row__media">
                    {line.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={line.imageUrl} alt="" />
                    ) : (
                      <span className="tienda-cart-row__media-empty" aria-hidden>
                        —
                      </span>
                    )}
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
                        {line.customization.quantityTextGroups?.map(
                          (group, gi) =>
                            group.quantity > 0 ? (
                              <li key={`qty-${group.label}-${gi}`}>
                                <span className="tienda-cart-row__custom-label">
                                  {group.label} ({group.quantity})
                                </span>
                                {group.texts?.some((t) => t.value) ? (
                                  <ul className="tienda-cart-row__custom-nested">
                                    {group.texts.map((text, ti) =>
                                      text.value ? (
                                        <li key={`${text.label}-${ti}`}>
                                          <span className="tienda-cart-row__custom-label">
                                            {text.label}:
                                          </span>{" "}
                                          {text.value}
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

                    {line.customization?.photos?.some((p) => p.url) ? (
                      <div className="tienda-cart-row__photos">
                        {line.customization.photos.map((photo, index) =>
                          photo.url ? (
                            <div
                              key={`photo-${photo.label}-${index}`}
                              className="tienda-cart-row__photo"
                              title={photo.label}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={webStoreFileUrl(photo.url)}
                                alt={photo.label}
                              />
                            </div>
                          ) : null,
                        )}
                      </div>
                    ) : null}

                    <p className="tienda-cart-row__unit-price">
                      {formatEuroFromCents(line.salePriceCents)}
                    </p>
                    {extra > 0 ? (
                      <p className="tienda-cart-row__unit">
                        {formatEuroFromCents(line.salePriceCents - extra)} +{" "}
                        {formatEuroFromCents(extra)} pers.
                      </p>
                    ) : null}

                    <div className="tienda-cart-row__controls">
                      <div
                        className="tienda-cart-row__qty"
                        role="group"
                        aria-label="Cantidad"
                      >
                        <button
                          type="button"
                          aria-label="Restar"
                          onClick={() =>
                            setQuantity(line.lineId, line.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span>{line.quantity}</span>
                        <button
                          type="button"
                          aria-label="Sumar"
                          onClick={() =>
                            setQuantity(line.lineId, line.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="tienda-cart-row__remove"
                        onClick={() => removeLine(line.lineId)}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>

                  <p className="tienda-cart-row__total">
                    {formatEuroFromCents(lineTotal)}
                  </p>
                </li>
              );
            })}
          </ul>

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
            <Link
              href="/tienda/checkout"
              className="tienda-btn tienda-btn--solid"
            >
              Finalizar pedido
            </Link>
          </div>
        </>
      )}
    </>
  );
}
