"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";

import { lockScroll, unlockScroll } from "@/lib/scroll-lock";
import type { WebStoreProduct } from "@/lib/web-store/types";
import {
  formatEuroFromCents,
  variantCombinationKey,
} from "@/lib/web-store/utils";

import { TiendaProductDescription } from "./tienda-product-description";
import { TiendaProductGallery } from "./tienda-product-gallery";
import { useWebStoreCart } from "./web-store-cart";

const EXIT_MS = 520;

type Props = {
  product: WebStoreProduct | null;
  open: boolean;
  onClose: () => void;
};

export function TiendaProductSheet({ product, open, onClose }: Props) {
  const { addProduct } = useWebStoreCart();
  const titleId = useId();
  const [portalReady, setPortalReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeProduct, setActiveProduct] = useState<WebStoreProduct | null>(
    null,
  );
  const [variantKey, setVariantKey] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (open && product) {
      setActiveProduct(product);
      setMounted(true);
      const hasVariants = product.variants.length > 0;
      setVariantKey(
        hasVariants
          ? variantCombinationKey(product.variants[0]!.optionValues)
          : null,
      );
      setQty(1);
      setTextValues({});
      setFieldErrors({});
      setFormNotice(null);
      setAdded(false);
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setActiveProduct(null);
    }, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open, product]);

  useEffect(() => {
    if (!open || !product) return;
    lockScroll();
    return () => unlockScroll();
  }, [open, product]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  const selectedVariant = useMemo(() => {
    if (!activeProduct || !variantKey) return null;
    return (
      activeProduct.variants.find(
        (v) => variantCombinationKey(v.optionValues) === variantKey,
      ) ?? null
    );
  }, [activeProduct, variantKey]);

  if (!portalReady || !mounted || !activeProduct) return null;

  const hasVariants = activeProduct.variants.length > 0;
  const unitCents =
    selectedVariant?.salePriceCents ?? activeProduct.salePriceCents;
  const stock =
    selectedVariant?.stockQuantity ?? activeProduct.stockQuantity ?? null;
  const outOfStock = stock != null && stock <= 0;
  const personalization = activeProduct.personalization;
  const textFields =
    personalization?.enabled !== false
      ? (personalization?.textFields ?? [])
      : [];
  const photoRequired = Boolean(
    personalization?.photoFields?.some((f) => f.required),
  );
  const requireAtLeastOneTextOrPhoto = Boolean(
    personalization?.requireAtLeastOneTextOrPhoto,
  );

  const isTextFieldRequired = (label: string) => {
    const field = textFields.find((item) => item.label === label);
    if (!field) return false;
    if (field.required) return true;
    // En web no hay foto: si pide texto o foto, el único campo de texto es obligatorio.
    if (requireAtLeastOneTextOrPhoto && textFields.length === 1) return true;
    return false;
  };

  const validatePersonalization = (): {
    ok: boolean;
    errors: Record<string, string>;
    notice: string | null;
  } => {
    const errors: Record<string, string> = {};
    for (const field of textFields) {
      const value = String(textValues[field.label] ?? "").trim();
      if (isTextFieldRequired(field.label) && !value) {
        errors[field.label] = `Completa «${field.label}» para continuar.`;
      }
    }
    if (
      requireAtLeastOneTextOrPhoto &&
      textFields.length > 1 &&
      !textFields.some((field) => String(textValues[field.label] ?? "").trim())
    ) {
      return {
        ok: false,
        errors,
        notice: "Indica al menos un texto de personalización.",
      };
    }
    const missingLabels = Object.keys(errors);
    if (missingLabels.length) {
      return {
        ok: false,
        errors,
        notice:
          missingLabels.length === 1
            ? "Falta un campo obligatorio."
            : "Faltan campos obligatorios.",
      };
    }
    return { ok: true, errors: {}, notice: null };
  };

  const hardBlock = outOfStock || photoRequired || (hasVariants && !variantKey);

  const onAdd = (event?: FormEvent) => {
    event?.preventDefault();
    if (outOfStock || photoRequired || added) return;
    if (hasVariants && !variantKey) {
      setFormNotice("Elige una opción del producto.");
      return;
    }

    const validation = validatePersonalization();
    setFieldErrors(validation.errors);
    setFormNotice(validation.notice);
    if (!validation.ok) {
      const firstErrorLabel = Object.keys(validation.errors)[0];
      if (firstErrorLabel) {
        const input = document.getElementById(
          `sheet-pers-${firstErrorLabel}`,
        ) as HTMLInputElement | null;
        input?.focus({ preventScroll: false });
        input?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      return;
    }

    const texts = textFields
      .map((field) => ({
        label: field.label,
        value: String(textValues[field.label] ?? "").trim(),
      }))
      .filter((t) => t.value);
    addProduct(activeProduct, {
      variantKey,
      quantity: qty,
      customization: texts.length ? { texts } : null,
    });
    setAdded(true);
    window.setTimeout(() => {
      onClose();
    }, 700);
  };

  return createPortal(
    <div
      className={
        "tienda-sheet" + (visible ? " tienda-sheet--visible" : "")
      }
    >
      <button
        type="button"
        className="tienda-sheet__backdrop"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="tienda-sheet__panel"
      >
        <header className="tienda-sheet__header">
          <p className="tienda-sheet__eyebrow">Añadir al carrito</p>
          <button
            type="button"
            className="tienda-sheet__close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="tienda-sheet__scroll">
          <TiendaProductGallery
            photos={activeProduct.photos}
            alt={activeProduct.name}
          />

          <div className="tienda-sheet__body">
            <h2 id={titleId} className="tienda-sheet__title">
              {activeProduct.name}
            </h2>
            <p className="tienda-sheet__price">
              {formatEuroFromCents(unitCents)}
            </p>
            {activeProduct.description ? (
              <TiendaProductDescription html={activeProduct.description} />
            ) : null}

            <form className="tienda-sheet__form" onSubmit={onAdd}>
              {hasVariants ? (
                <div className="tienda-field">
                  <span className="tienda-label">Opciones</span>
                  <div className="tienda-variants tienda-variants--grid">
                    {activeProduct.variants.map((variant) => {
                      const key = variantCombinationKey(variant.optionValues);
                      const label = Object.values(variant.optionValues).join(
                        " · ",
                      );
                      return (
                        <button
                          key={variant.id || key}
                          type="button"
                          className={
                            "tienda-chip tienda-chip--block" +
                            (variantKey === key ? " is-selected" : "")
                          }
                          onClick={() => setVariantKey(key)}
                        >
                          <span>{label || "Opción"}</span>
                          <span className="tienda-chip__price">
                            {formatEuroFromCents(variant.salePriceCents)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {textFields.map((field) => {
                const required = isTextFieldRequired(field.label);
                const error = fieldErrors[field.label];
                const inputId = `sheet-pers-${field.label}`;
                return (
                  <div
                    key={field.label}
                    className={
                      "tienda-field" + (error ? " tienda-field--error" : "")
                    }
                  >
                    <label htmlFor={inputId}>
                      {field.label}
                      {required ? " *" : ""}
                    </label>
                    <input
                      id={inputId}
                      className="tienda-input"
                      maxLength={field.maxLength ?? 120}
                      placeholder={field.placeholder ?? undefined}
                      required={required}
                      aria-required={required}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? `${inputId}-error` : undefined}
                      value={textValues[field.label] ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setTextValues((prev) => ({
                          ...prev,
                          [field.label]: value,
                        }));
                        if (fieldErrors[field.label] || formNotice) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next[field.label];
                            return next;
                          });
                          setFormNotice(null);
                        }
                      }}
                    />
                    {error ? (
                      <p
                        id={`${inputId}-error`}
                        className="tienda-field__error"
                        role="alert"
                      >
                        {error}
                      </p>
                    ) : null}
                  </div>
                );
              })}

              {photoRequired ? (
                <p className="tienda-note">
                  Este producto requiere foto de personalización. De momento no
                  está disponible en la tienda web; escríbenos o reserva en Care.
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
                <p className="tienda-status tienda-status--error">
                  Sin stock ahora mismo.
                </p>
              ) : null}

              {formNotice ? (
                <p className="tienda-sheet__notice" role="alert">
                  {formNotice}
                </p>
              ) : null}

              <div className="tienda-sheet__actions">
                <button
                  type="submit"
                  className="tienda-btn tienda-btn--solid tienda-sheet__cta"
                  disabled={hardBlock || added}
                >
                  {added ? "Añadido" : "Añadir al carrito"}
                </button>
                {added ? (
                  <Link href="/tienda/carrito" className="tienda-link is-active">
                    Ver carrito
                  </Link>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
