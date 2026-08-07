"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { WebStoreProduct } from "@/lib/web-store/types";
import {
  formatEuroFromCents,
  variantCombinationKey,
  webStoreFileUrl,
} from "@/lib/web-store/utils";

import { useWebStoreCart } from "../../web-store-cart";

export function ProductBuyPanel({ product }: { product: WebStoreProduct }) {
  const { addProduct } = useWebStoreCart();
  const hasVariants = product.variants.length > 0;
  const [variantKey, setVariantKey] = useState<string | null>(() =>
    hasVariants
      ? variantCombinationKey(product.variants[0]!.optionValues)
      : null,
  );
  const [qty, setQty] = useState(1);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);

  const selectedVariant = useMemo(() => {
    if (!variantKey) return null;
    return (
      product.variants.find(
        (v) => variantCombinationKey(v.optionValues) === variantKey,
      ) ?? null
    );
  }, [product.variants, variantKey]);

  const unitCents = selectedVariant?.salePriceCents ?? product.salePriceCents;
  const stock =
    selectedVariant?.stockQuantity ?? product.stockQuantity ?? null;
  const outOfStock = stock != null && stock <= 0;
  const img = webStoreFileUrl(product.photos[0]?.url);
  const personalization = product.personalization;
  const textFields =
    personalization?.enabled !== false ? personalization?.textFields ?? [] : [];
  const photoRequired = Boolean(
    personalization?.photoFields?.some((f) => f.required),
  );

  const missingRequiredText = textFields.some(
    (field) => field.required && !String(textValues[field.label] ?? "").trim(),
  );

  const canAdd =
    !outOfStock &&
    !photoRequired &&
    !missingRequiredText &&
    (!hasVariants || Boolean(variantKey));

  const onAdd = () => {
    if (!canAdd) return;
    const texts = textFields
      .map((field) => ({
        label: field.label,
        value: String(textValues[field.label] ?? "").trim(),
      }))
      .filter((t) => t.value);
    addProduct(product, {
      variantKey,
      quantity: qty,
      customization: texts.length ? { texts } : null,
    });
    setAdded(true);
  };

  return (
    <div className="tienda-product">
      <div className="tienda-product__media">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" />
        ) : null}
      </div>
      <div className="tienda-product__copy">
        <p className="tienda-card__price">{formatEuroFromCents(unitCents)}</p>
        {product.description ? (
          <p className="tienda-product__desc">{product.description}</p>
        ) : null}

        {hasVariants ? (
          <div className="tienda-field">
            <span className="tienda-label">Opciones</span>
            <div className="tienda-variants">
              {product.variants.map((variant) => {
                const key = variantCombinationKey(variant.optionValues);
                const label = Object.values(variant.optionValues).join(" · ");
                return (
                  <button
                    key={variant.id || key}
                    type="button"
                    className={
                      "tienda-chip" + (variantKey === key ? " is-selected" : "")
                    }
                    onClick={() => setVariantKey(key)}
                  >
                    {label || "Opción"}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {textFields.map((field) => (
          <div key={field.label} className="tienda-field">
            <label htmlFor={`pers-${field.label}`}>
              {field.label}
              {field.required ? " *" : ""}
            </label>
            <input
              id={`pers-${field.label}`}
              className="tienda-input"
              maxLength={field.maxLength ?? 120}
              placeholder={field.placeholder ?? undefined}
              value={textValues[field.label] ?? ""}
              onChange={(event) =>
                setTextValues((prev) => ({
                  ...prev,
                  [field.label]: event.target.value,
                }))
              }
            />
          </div>
        ))}

        {photoRequired ? (
          <p className="tienda-note">
            Este producto requiere foto de personalización. De momento no está
            disponible en la tienda web; escríbenos o reserva en Care.
          </p>
        ) : null}

        <div className="tienda-field">
          <span className="tienda-label">Cantidad</span>
          <div className="tienda-qty">
            <button
              type="button"
              aria-label="Restar"
              onClick={() => setQty((n) => Math.max(1, n - 1))}
            >
              −
            </button>
            <span>{qty}</span>
            <button
              type="button"
              aria-label="Sumar"
              onClick={() => setQty((n) => Math.min(99, n + 1))}
            >
              +
            </button>
          </div>
        </div>

        {outOfStock ? (
          <p className="tienda-status tienda-status--error">Sin stock ahora mismo.</p>
        ) : null}

        <div className="tienda-nav-links">
          <button
            type="button"
            className="tienda-btn tienda-btn--solid"
            disabled={!canAdd}
            onClick={onAdd}
          >
            Añadir al carrito
          </button>
          {added ? (
            <Link href="/tienda/carrito" className="tienda-link is-active">
              Ver carrito
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
