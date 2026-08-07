"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

import { lockScroll, unlockScroll } from "@/lib/scroll-lock";
import {
  postWebStoreCustomizationPhoto,
  WebStoreRequestError,
} from "@/lib/web-store/api";
import {
  formatQuantityTextSlotLabel,
  maxQuantityTextGroupFromLinkedStock,
  personalizationExtraCentsFromCustomization,
  productHasPricedPersonalization,
  quantityTextGroupExtraCents,
  quantityTextSlotKey,
} from "@/lib/web-store/personalization";
import type { WebStoreProduct } from "@/lib/web-store/types";
import {
  formatEuroFromCents,
  variantCombinationKey,
  webStoreFileUrl,
} from "@/lib/web-store/utils";

import { TiendaProductDescription } from "./tienda-product-description";
import { TiendaProductGallery } from "./tienda-product-gallery";
import { TiendaPersonalizationAiButton } from "./tienda-personalization-ai-button";
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
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [photoPreviews, setPhotoPreviews] = useState<Record<string, string>>(
    {},
  );
  const [photoUploading, setPhotoUploading] = useState<string | null>(null);
  const [qtyGroupQuantities, setQtyGroupQuantities] = useState<
    Record<number, number>
  >({});
  const [qtyTextValues, setQtyTextValues] = useState<Record<string, string>>(
    {},
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const photoPreviewUrlsRef = useRef<Record<string, string>>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startY: number;
    lastY: number;
    lastTs: number;
    dy: number;
    velocity: number;
    active: boolean;
  } | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!visible) {
      const panel = panelRef.current;
      if (panel) {
        panel.style.transform = "";
        panel.style.transition = "";
        panel.classList.remove("tienda-sheet__panel--dragging");
      }
      dragRef.current = null;
    }
  }, [visible]);

  const onHandlePointerDown = (
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    if (event.button !== 0) return;
    const panel = panelRef.current;
    if (!panel) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      lastY: event.clientY,
      lastTs: performance.now(),
      dy: 0,
      velocity: 0,
      active: true,
    };
    panel.classList.add("tienda-sheet__panel--dragging");
    panel.style.transition = "none";
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHandlePointerMove = (
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    const drag = dragRef.current;
    const panel = panelRef.current;
    if (!drag?.active || drag.pointerId !== event.pointerId || !panel) return;
    const now = performance.now();
    const dt = Math.max(1, now - drag.lastTs);
    drag.velocity = (event.clientY - drag.lastY) / dt;
    drag.lastY = event.clientY;
    drag.lastTs = now;
    const dy = Math.max(0, event.clientY - drag.startY);
    drag.dy = dy;
    panel.style.transform = `translate3d(0, ${dy}px, 0)`;
    const backdrop = panel.parentElement?.querySelector(
      ".tienda-sheet__backdrop",
    );
    if (backdrop instanceof HTMLElement) {
      backdrop.style.opacity = String(Math.max(0.25, 1 - dy / 420));
    }
  };

  const endHandleDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    const panel = panelRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;

    const shouldClose = drag.dy > 110 || (drag.dy > 48 && drag.velocity > 0.45);

    const backdrop = panel?.parentElement?.querySelector(
      ".tienda-sheet__backdrop",
    );
    if (backdrop instanceof HTMLElement) {
      backdrop.style.opacity = "";
    }

    if (!panel) {
      if (shouldClose) onClose();
      return;
    }

    panel.classList.remove("tienda-sheet__panel--dragging");
    panel.style.transition = "";

    if (shouldClose) {
      panel.style.transform = "translate3d(0, 104%, 0)";
      onClose();
      return;
    }

    panel.style.transform = "translate3d(0, 0, 0)";
    window.setTimeout(() => {
      if (panelRef.current === panel) panel.style.transform = "";
    }, EXIT_MS);
  };

  useEffect(() => {
    if (open && product) {
      setActiveProduct(product);
      setMounted(true);
      setVisible(false);
      const hasVariants = product.variants.length > 0;
      setVariantKey(
        hasVariants
          ? variantCombinationKey(product.variants[0]!.optionValues)
          : null,
      );
      setQty(1);
      setTextValues({});
      setPhotoUrls({});
      for (const url of Object.values(photoPreviewUrlsRef.current)) {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      }
      photoPreviewUrlsRef.current = {};
      setPhotoPreviews({});
      setPhotoUploading(null);
      const groups = product.personalization?.quantityTextGroups ?? [];
      setQtyGroupQuantities(
        Object.fromEntries(groups.map((g, i) => [i, g.minQuantity])),
      );
      setQtyTextValues({});
      setFieldErrors({});
      setFormNotice(null);
      setAdded(false);
      let frame2 = 0;
      const frame1 = window.requestAnimationFrame(() => {
        frame2 = window.requestAnimationFrame(() => setVisible(true));
      });
      return () => {
        window.cancelAnimationFrame(frame1);
        if (frame2) window.cancelAnimationFrame(frame2);
      };
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

  useEffect(() => {
    return () => {
      for (const url of Object.values(photoPreviewUrlsRef.current)) {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      }
    };
  }, []);

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
  const personalization = activeProduct.personalization;
  const persEnabled = personalization?.enabled !== false;
  const textFields = persEnabled ? (personalization?.textFields ?? []) : [];
  const photoFields = persEnabled ? (personalization?.photoFields ?? []) : [];
  const quantityTextGroups = persEnabled
    ? (personalization?.quantityTextGroups ?? [])
    : [];
  const requireAtLeastOneTextOrPhoto = Boolean(
    personalization?.requireAtLeastOneTextOrPhoto,
  );

  const customizationPreview = {
    texts: textFields.map((field) => ({
      label: field.label,
      value: String(textValues[field.label] ?? "").trim(),
    })),
    photos: photoFields.map((field) => ({
      label: field.label,
      url: String(photoUrls[field.label] ?? "").trim(),
    })),
    quantityTextGroups: quantityTextGroups.map((group, gi) => {
      const quantity = qtyGroupQuantities[gi] ?? group.minQuantity;
      return {
        label: group.label,
        quantity,
        texts: Array.from({ length: quantity }, (_, si) => ({
          label: formatQuantityTextSlotLabel(group.textLabelTemplate, si),
          value: String(qtyTextValues[quantityTextSlotKey(gi, si)] ?? "").trim(),
        })),
      };
    }),
  };

  const baseUnitCents =
    selectedVariant?.salePriceCents ?? activeProduct.salePriceCents;
  const extraUnitCents = personalizationExtraCentsFromCustomization(
    personalization,
    customizationPreview,
  );
  const unitCents = baseUnitCents + extraUnitCents;
  const stock =
    selectedVariant?.stockQuantity ?? activeProduct.stockQuantity ?? null;
  const outOfStock = stock != null && stock <= 0;

  const hasAnyText = textFields.some((field) =>
    String(textValues[field.label] ?? "").trim(),
  );
  const hasAnyPhoto = photoFields.some((field) =>
    String(photoUrls[field.label] ?? "").trim(),
  );

  const allFilledTexts = [
    ...textFields
      .map((field) => String(textValues[field.label] ?? "").trim())
      .filter(Boolean),
    ...Object.values(qtyTextValues)
      .map((value) => String(value ?? "").trim())
      .filter(Boolean),
  ];

  const guessedPetName =
    textFields
      .map((field) => ({
        label: field.label.toLowerCase(),
        value: String(textValues[field.label] ?? "").trim(),
      }))
      .find(
        (row) =>
          row.value &&
          /mascota|perro|gato|nombre|huella|compañer/.test(row.label),
      )?.value ||
    Object.values(qtyTextValues)
      .map((value) => String(value ?? "").trim())
      .find(Boolean) ||
    null;

  const isTextFieldRequired = (label: string) => {
    const field = textFields.find((item) => item.label === label);
    return Boolean(field?.required);
  };

  const isPhotoFieldRequired = (label: string) => {
    const field = photoFields.find((item) => item.label === label);
    return Boolean(field?.required);
  };

  const clearFieldError = (key: string) => {
    if (!fieldErrors[key] && !formNotice) return;
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setFormNotice(null);
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
    for (const field of photoFields) {
      const url = String(photoUrls[field.label] ?? "").trim();
      if (isPhotoFieldRequired(field.label) && !url) {
        errors[`photo:${field.label}`] =
          `Sube la imagen de «${field.label}» para continuar.`;
      }
    }
    for (let gi = 0; gi < quantityTextGroups.length; gi++) {
      const group = quantityTextGroups[gi]!;
      const quantity = qtyGroupQuantities[gi] ?? group.minQuantity;
      if (quantity < group.minQuantity) {
        errors[`qty:${gi}`] =
          `Elige al menos ${group.minQuantity} de «${group.label}».`;
        continue;
      }
      if (group.required !== false && quantity > 0) {
        for (let si = 0; si < quantity; si++) {
          const key = quantityTextSlotKey(gi, si);
          const label = formatQuantityTextSlotLabel(group.textLabelTemplate, si);
          const value = String(qtyTextValues[key] ?? "").trim();
          if (!value) {
            errors[key] = `Completa «${label}» para continuar.`;
          }
        }
      }
    }
    if (
      requireAtLeastOneTextOrPhoto &&
      textFields.length > 0 &&
      photoFields.length > 0 &&
      !hasAnyText &&
      !hasAnyPhoto
    ) {
      return {
        ok: false,
        errors,
        notice: "Indica un texto o sube una foto para personalizar.",
      };
    }
    if (
      requireAtLeastOneTextOrPhoto &&
      textFields.length > 0 &&
      photoFields.length === 0 &&
      !hasAnyText
    ) {
      return {
        ok: false,
        errors,
        notice: "Indica al menos un texto de personalización.",
      };
    }
    if (
      requireAtLeastOneTextOrPhoto &&
      photoFields.length > 0 &&
      textFields.length === 0 &&
      !hasAnyPhoto
    ) {
      return {
        ok: false,
        errors,
        notice: "Sube al menos una foto de personalización.",
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

  const hardBlock =
    outOfStock || photoUploading != null || (hasVariants && !variantKey);

  const uploadPhoto = async (label: string, file: File) => {
    const blobPreview = URL.createObjectURL(file);
    const prevPreview = photoPreviewUrlsRef.current[label];
    if (prevPreview?.startsWith("blob:")) URL.revokeObjectURL(prevPreview);
    photoPreviewUrlsRef.current = {
      ...photoPreviewUrlsRef.current,
      [label]: blobPreview,
    };
    setPhotoPreviews((prev) => ({ ...prev, [label]: blobPreview }));
    setPhotoUploading(label);
    clearFieldError(`photo:${label}`);
    try {
      const { url } = await postWebStoreCustomizationPhoto(file);
      setPhotoUrls((prev) => ({ ...prev, [label]: url }));
    } catch (error) {
      setPhotoUrls((prev) => {
        const next = { ...prev };
        delete next[label];
        return next;
      });
      const message =
        error instanceof WebStoreRequestError
          ? error.message
          : "No se pudo subir la foto. Inténtalo de nuevo.";
      setFormNotice(message);
      setFieldErrors((prev) => ({
        ...prev,
        [`photo:${label}`]: message,
      }));
    } finally {
      const current = photoPreviewUrlsRef.current[label];
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      const nextPreviews = { ...photoPreviewUrlsRef.current };
      delete nextPreviews[label];
      photoPreviewUrlsRef.current = nextPreviews;
      setPhotoPreviews((prev) => {
        const next = { ...prev };
        delete next[label];
        return next;
      });
      setPhotoUploading(null);
    }
  };

  const onAdd = (event?: FormEvent) => {
    event?.preventDefault();
    if (outOfStock || photoUploading != null || added) return;
    if (hasVariants && !variantKey) {
      setFormNotice("Elige una opción del producto.");
      return;
    }

    const validation = validatePersonalization();
    setFieldErrors(validation.errors);
    setFormNotice(validation.notice);
    if (!validation.ok) {
      const firstErrorKey = Object.keys(validation.errors)[0];
      if (firstErrorKey) {
        const inputId = firstErrorKey.startsWith("photo:")
          ? `sheet-photo-${firstErrorKey.slice(6)}`
          : firstErrorKey.startsWith("qty:")
            ? `sheet-qty-${firstErrorKey.slice(4)}`
            : firstErrorKey.includes(":")
              ? `sheet-qty-text-${firstErrorKey}`
              : `sheet-pers-${firstErrorKey}`;
        const input = document.getElementById(inputId) as HTMLElement | null;
        input?.focus({ preventScroll: false });
        input?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      return;
    }

    const texts = textFields.map((field) => ({
      label: field.label,
      value: String(textValues[field.label] ?? "").trim(),
    }));
    const photos = photoFields.map((field) => ({
      label: field.label,
      url: String(photoUrls[field.label] ?? "").trim(),
    }));
    const qtyGroups = quantityTextGroups.map((group, gi) => {
      const quantity = qtyGroupQuantities[gi] ?? group.minQuantity;
      return {
        label: group.label,
        quantity,
        texts: Array.from({ length: quantity }, (_, si) => ({
          label: formatQuantityTextSlotLabel(group.textLabelTemplate, si),
          value: String(qtyTextValues[quantityTextSlotKey(gi, si)] ?? "").trim(),
        })),
      };
    });
    const hasContent =
      texts.some((t) => t.value) ||
      photos.some((p) => p.url) ||
      qtyGroups.some((g) => g.quantity > 0 || g.texts.some((t) => t.value));

    addProduct(activeProduct, {
      variantKey,
      quantity: qty,
      customization: hasContent
        ? {
            ...(texts.length ? { texts } : {}),
            ...(photos.length ? { photos } : {}),
            ...(qtyGroups.length ? { quantityTextGroups: qtyGroups } : {}),
          }
        : null,
    });
    setAdded(true);
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
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="tienda-sheet__panel"
      >
        <header className="tienda-sheet__header">
          <div
            className="tienda-sheet__grabber"
            role="button"
            tabIndex={0}
            aria-label="Arrastra hacia abajo para cerrar"
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={endHandleDrag}
            onPointerCancel={endHandleDrag}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClose();
              }
            }}
          >
            <span className="tienda-sheet__grabber-bar" aria-hidden={true} />
          </div>
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
            {extraUnitCents > 0 ? (
              <p className="tienda-sheet__price-extra">
                {formatEuroFromCents(baseUnitCents)} +{" "}
                {formatEuroFromCents(extraUnitCents)} personalización
                {qty > 1
                  ? ` · Total ${formatEuroFromCents(unitCents * qty)}`
                  : ""}
              </p>
            ) : productHasPricedPersonalization(personalization) ? (
              <p className="tienda-sheet__price-extra">
                Precio base; la personalización puede sumar suplemento
              </p>
            ) : null}
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

              {textFields.length > 0 &&
              photoFields.length > 0 &&
              requireAtLeastOneTextOrPhoto ? (
                <p className="tienda-note">
                  Puedes personalizar con texto, con foto, o con ambos.
                </p>
              ) : null}

              {quantityTextGroups.map((group, gi) => {
                const quantity = qtyGroupQuantities[gi] ?? group.minQuantity;
                const fromStock = maxQuantityTextGroupFromLinkedStock(
                  activeProduct,
                  gi,
                );
                const maxQuantity =
                  fromStock != null
                    ? Math.min(group.maxQuantity, fromStock)
                    : group.maxQuantity;
                const extraPer = group.extraPriceCentsPerUnit;
                const extraTotal = quantityTextGroupExtraCents(group, quantity);
                const groupError = fieldErrors[`qty:${gi}`];
                return (
                  <div
                    key={`qg-${gi}`}
                    className={
                      "tienda-qty-group" +
                      (groupError ? " tienda-qty-group--error" : "")
                    }
                  >
                    <div className="tienda-qty-group__head">
                      <div className="tienda-qty-group__title-row">
                        <span className="tienda-qty-group__label">
                          {group.label}
                        </span>
                        <div
                          className="tienda-qty"
                          role="group"
                          aria-label={`Cantidad de ${group.label}`}
                        >
                          <button
                            type="button"
                            id={`sheet-qty-${gi}`}
                            aria-label={`Quitar una ${group.label}`}
                            disabled={added || quantity <= group.minQuantity}
                            onClick={() => {
                              setQtyGroupQuantities((prev) => ({
                                ...prev,
                                [gi]: Math.max(group.minQuantity, quantity - 1),
                              }));
                              clearFieldError(`qty:${gi}`);
                            }}
                          >
                            −
                          </button>
                          <span>{quantity}</span>
                          <button
                            type="button"
                            aria-label={`Añadir una ${group.label}`}
                            disabled={added || quantity >= maxQuantity}
                            onClick={() => {
                              setQtyGroupQuantities((prev) => ({
                                ...prev,
                                [gi]: Math.min(maxQuantity, quantity + 1),
                              }));
                              clearFieldError(`qty:${gi}`);
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {extraPer > 0 ? (
                        <p className="tienda-qty-group__extra">
                          {group.firstUnitIncludedInPrice
                            ? `1.ª incluida · +${formatEuroFromCents(extraPer)} desde la 2.ª`
                            : `+${formatEuroFromCents(extraPer)} / ud.`}
                          {extraTotal > 0
                            ? ` · +${formatEuroFromCents(extraTotal)}`
                            : ""}
                        </p>
                      ) : null}
                    </div>

                    {quantity > 0 ? (
                      <div className="tienda-qty-group__slots">
                        {Array.from({ length: quantity }, (_, si) => {
                          const key = quantityTextSlotKey(gi, si);
                          const label = formatQuantityTextSlotLabel(
                            group.textLabelTemplate,
                            si,
                          );
                          const error = fieldErrors[key];
                          const inputId = `sheet-qty-text-${key}`;
                          const maxLen =
                            group.maxLength != null && group.maxLength > 0
                              ? group.maxLength
                              : null;
                          return (
                            <div
                              key={key}
                              className={
                                "tienda-field" +
                                (error ? " tienda-field--error" : "")
                              }
                            >
                              <div className="tienda-field__label-row">
                                <label htmlFor={inputId}>
                                  {label}
                                  {group.required !== false ? " *" : ""}
                                </label>
                                <TiendaPersonalizationAiButton
                                  productName={activeProduct.name}
                                  fieldLabel={label}
                                  maxLength={maxLen}
                                  currentValue={qtyTextValues[key] ?? ""}
                                  otherTexts={allFilledTexts.filter(
                                    (t) =>
                                      t !==
                                      String(qtyTextValues[key] ?? "").trim(),
                                  )}
                                  petName={guessedPetName}
                                  disabled={added}
                                  onGenerated={(text) => {
                                    let next = text;
                                    if (
                                      maxLen != null &&
                                      next.length > maxLen
                                    ) {
                                      next = next.slice(0, maxLen);
                                    }
                                    setQtyTextValues((prev) => ({
                                      ...prev,
                                      [key]: next,
                                    }));
                                    clearFieldError(key);
                                  }}
                                />
                              </div>
                              <input
                                id={inputId}
                                className="tienda-input"
                                maxLength={maxLen ?? undefined}
                                placeholder={
                                  group.textPlaceholder ?? undefined
                                }
                                disabled={added}
                                aria-invalid={Boolean(error)}
                                value={qtyTextValues[key] ?? ""}
                                onChange={(event) => {
                                  let next = event.target.value;
                                  if (maxLen != null && next.length > maxLen) {
                                    next = next.slice(0, maxLen);
                                  }
                                  setQtyTextValues((prev) => ({
                                    ...prev,
                                    [key]: next,
                                  }));
                                  clearFieldError(key);
                                }}
                              />
                              {error ? (
                                <p className="tienda-field__error" role="alert">
                                  {error}
                                </p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : group.minQuantity === 0 ? (
                      <p className="tienda-note">
                        Opcional — sube la cantidad si quieres añadir{" "}
                        {group.label.toLowerCase()}.
                      </p>
                    ) : null}

                    {groupError ? (
                      <p className="tienda-field__error" role="alert">
                        {groupError}
                      </p>
                    ) : null}
                  </div>
                );
              })}

              {textFields.map((field) => {
                const required = isTextFieldRequired(field.label);
                const error = fieldErrors[field.label];
                const inputId = `sheet-pers-${field.label}`;
                const extra =
                  field.extraPriceCents != null && field.extraPriceCents > 0
                    ? `+${formatEuroFromCents(field.extraPriceCents)}`
                    : null;
                return (
                  <div
                    key={field.label}
                    className={
                      "tienda-field" + (error ? " tienda-field--error" : "")
                    }
                  >
                    <div className="tienda-field__label-row">
                      <label htmlFor={inputId}>
                        {field.label}
                        {required ? " *" : ""}
                        {extra ? (
                          <span className="tienda-field__extra"> {extra}</span>
                        ) : null}
                      </label>
                      <TiendaPersonalizationAiButton
                        productName={activeProduct.name}
                        fieldLabel={field.label}
                        maxLength={field.maxLength ?? 120}
                        currentValue={textValues[field.label] ?? ""}
                        otherTexts={allFilledTexts.filter(
                          (t) =>
                            t !==
                            String(textValues[field.label] ?? "").trim(),
                        )}
                        petName={guessedPetName}
                        disabled={added}
                        onGenerated={(text) => {
                          let next = text;
                          const max = field.maxLength ?? 120;
                          if (max > 0 && next.length > max) {
                            next = next.slice(0, max);
                          }
                          setTextValues((prev) => ({
                            ...prev,
                            [field.label]: next,
                          }));
                          clearFieldError(field.label);
                        }}
                      />
                    </div>
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
                        clearFieldError(field.label);
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

              {photoFields.map((field) => {
                const required = isPhotoFieldRequired(field.label);
                const errorKey = `photo:${field.label}`;
                const error = fieldErrors[errorKey];
                const buttonId = `sheet-photo-${field.label}`;
                const fileId = `${buttonId}-file`;
                const url = photoUrls[field.label];
                const preview = photoPreviews[field.label];
                const displaySrc =
                  preview || (url ? webStoreFileUrl(url) : "");
                const uploading = photoUploading === field.label;
                const extra =
                  field.extraPriceCents != null && field.extraPriceCents > 0
                    ? `+${formatEuroFromCents(field.extraPriceCents)}`
                    : null;
                return (
                  <div
                    key={field.label}
                    className={
                      "tienda-photo-field" +
                      (error ? " tienda-photo-field--error" : "")
                    }
                  >
                    <div className="tienda-photo-field__head">
                      <span className="tienda-photo-field__label">
                        {field.label}
                        {required ? " *" : ""}
                      </span>
                      {extra ? (
                        <span className="tienda-photo-field__extra">{extra}</span>
                      ) : null}
                    </div>
                    <div className="tienda-photo-field__row">
                      <button
                        type="button"
                        id={buttonId}
                        className={
                          "tienda-photo-field__thumb" +
                          (displaySrc ? " has-image" : "")
                        }
                        aria-label={
                          displaySrc
                            ? `Cambiar foto: ${field.label}`
                            : `Subir foto: ${field.label}`
                        }
                        disabled={uploading || added}
                        onClick={() =>
                          document.getElementById(fileId)?.click()
                        }
                      >
                        {displaySrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={displaySrc} alt="" />
                        ) : (
                          <span className="tienda-photo-field__placeholder">
                            Foto
                          </span>
                        )}
                        {uploading ? (
                          <span
                            className="tienda-photo-field__spin"
                            role="status"
                            aria-label="Subiendo foto"
                          />
                        ) : null}
                      </button>
                      <div className="tienda-photo-field__actions">
                        <button
                          type="button"
                          className="tienda-photo-field__btn"
                          disabled={uploading || added}
                          onClick={() =>
                            document.getElementById(fileId)?.click()
                          }
                        >
                          {uploading
                            ? "Subiendo…"
                            : displaySrc
                              ? "Cambiar foto"
                              : "Subir foto"}
                        </button>
                        <p className="tienda-photo-field__hint">
                          Elige desde la galería o la cámara.
                        </p>
                      </div>
                    </div>
                    <input
                      id={fileId}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploading || added}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadPhoto(field.label, file);
                        event.target.value = "";
                      }}
                    />
                    {error ? (
                      <p className="tienda-field__error" role="alert">
                        {error}
                      </p>
                    ) : null}
                  </div>
                );
              })}

              {personalization?.textAndPhotoExtraPriceCents != null &&
              personalization.textAndPhotoExtraPriceCents > 0 &&
              textFields.length > 0 &&
              photoFields.length > 0 ? (
                <p className="tienda-note">
                  Texto + foto: +
                  {formatEuroFromCents(
                    personalization.textAndPhotoExtraPriceCents,
                  )}
                </p>
              ) : null}

              <div className="tienda-field tienda-field--qty-price">
                <div>
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
                      onClick={() =>
                        setQty((n) =>
                          Math.min(
                            99,
                            stock != null && stock > 0 ? stock : 99,
                            n + 1,
                          ),
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="tienda-sheet__total">
                  {extraUnitCents > 0 ? (
                    <p className="tienda-sheet__total-break">
                      {formatEuroFromCents(baseUnitCents)} +{" "}
                      {formatEuroFromCents(extraUnitCents)} pers.
                    </p>
                  ) : null}
                  <p className="tienda-sheet__total-sum">
                    Total {formatEuroFromCents(unitCents * qty)}
                  </p>
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
                {added ? (
                  <>
                    <p className="tienda-sheet__added" role="status">
                      Añadido al carrito
                    </p>
                    <Link
                      href="/tienda/checkout"
                      className="tienda-btn tienda-btn--solid tienda-sheet__cta"
                    >
                      Finalizar pedido
                    </Link>
                    <button
                      type="button"
                      className="tienda-link is-active"
                      onClick={onClose}
                    >
                      Seguir mirando
                    </button>
                    <Link href="/tienda/carrito" className="tienda-link">
                      Ver carrito
                    </Link>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="tienda-btn tienda-btn--solid tienda-sheet__cta"
                    disabled={hardBlock}
                  >
                    Añadir al carrito
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
