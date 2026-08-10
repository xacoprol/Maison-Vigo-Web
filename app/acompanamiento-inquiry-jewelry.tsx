"use client";

import { useEffect, useMemo, useState } from "react";

import { postWebStoreCustomizationPhoto } from "@/lib/web-store/api";
import { formatQuantityTextSlotLabel } from "@/lib/web-store/personalization";
import type {
  WebStoreCartCustomization,
  WebStorePersonalization,
  WebStoreProduct,
} from "@/lib/web-store/types";
import { careApiBaseUrl } from "@/lib/web-store/utils";

export const MAX_INQUIRY_JEWELRY = 2;

export type InquiryJewelryItem = {
  productId: string;
  name: string;
  imageUrl: string | null;
  optionLabel: string | null;
  variantKey: string | null;
  quantity: number;
  unitPriceCents: number | null;
  customization: WebStoreCartCustomization | null;
};

type CatalogProduct = WebStoreProduct & {
  personalization: WebStorePersonalization;
};

function jewelryCatalogUrl(): string {
  if (typeof window !== "undefined") return "/api/acompanamientos/jewelry-catalog";
  const base = careApiBaseUrl();
  return base ? `${base}/public/acompanamientos/jewelry-catalog` : "";
}

function variantKey(optionValues: Record<string, string>): string {
  return Object.keys(optionValues)
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((k) => `${k}\x01${optionValues[k]}`)
    .join("\x01");
}

function optionLabel(optionValues: Record<string, string>): string {
  return Object.values(optionValues)
    .map((v) => String(v).trim())
    .filter(Boolean)
    .join(" · ");
}

function formatEur(cents: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function emptyCustomization(pers: WebStorePersonalization): WebStoreCartCustomization {
  return {
    texts: (pers?.textFields ?? []).map((f) => ({ label: f.label, value: "" })),
    photos: (pers?.photoFields ?? []).map((f) => ({ label: f.label, url: "" })),
    quantityTextGroups: (pers?.quantityTextGroups ?? []).map((g) => ({
      label: g.label,
      quantity: g.minQuantity ?? 0,
      texts: [],
    })),
  };
}

export function validateInquiryJewelryItems(items: InquiryJewelryItem[]): string | null {
  if (items.length > MAX_INQUIRY_JEWELRY) return "Máximo 2 joyas.";
  for (const item of items) {
    if (!item.productId.trim()) return "Elige una joya del catálogo.";
  }
  return null;
}

export function AcompanamientoInquiryJewelry({
  titleId,
  value,
  onChange,
}: {
  titleId: string;
  value: InquiryJewelryItem[];
  onChange: (next: InquiryJewelryItem[]) => void;
}) {
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [wantJewelry, setWantJewelry] = useState(value.length > 0);
  const [pickerId, setPickerId] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(jewelryCatalogUrl(), { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as { items?: CatalogProduct[] };
        if (!cancelled) setCatalog(Array.isArray(data.items) ? data.items : []);
      } catch {
        if (!cancelled) setCatalog([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const available = useMemo(() => {
    const taken = new Set(value.map((v) => v.productId));
    return catalog.filter((p) => !taken.has(p.id) || value.some((v) => v.productId === p.id));
  }, [catalog, value]);

  const addProduct = (productId: string) => {
    if (!productId || value.length >= MAX_INQUIRY_JEWELRY) return;
    const product = catalog.find((p) => p.id === productId);
    if (!product) return;
    if (value.some((v) => v.productId === productId)) return;
    const first = product.variants[0] ?? null;
    const next: InquiryJewelryItem = {
      productId: product.id,
      name: product.name,
      imageUrl: product.photos?.[0]?.url ?? null,
      optionLabel: first ? optionLabel(first.optionValues) : null,
      variantKey: first ? variantKey(first.optionValues) : null,
      quantity: 1,
      unitPriceCents: first?.salePriceCents ?? product.salePriceCents,
      customization: product.personalization?.enabled
        ? emptyCustomization(product.personalization)
        : null,
    };
    onChange([...value, next]);
    setPickerId("");
  };

  const updateItem = (index: number, patch: Partial<InquiryJewelryItem>) => {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  if (loading) {
    return (
      <p className="acompanamiento-inquiry-sheet__hint">Cargando joyas del catálogo…</p>
    );
  }

  if (!catalog.length) return null;

  return (
    <div className="acompanamiento-inquiry-sheet__jewelry">
      <label className="acompanamiento-inquiry-sheet__check">
        <input
          type="checkbox"
          checked={wantJewelry}
          onChange={(e) => {
            const on = e.target.checked;
            setWantJewelry(on);
            if (!on) onChange([]);
          }}
        />
        <span className="acompanamiento-inquiry-sheet__check-text">
          Joyas personalizadas
          <button
            type="button"
            className="acompanamiento-inquiry-sheet__tip"
            aria-label="Más información sobre joyas personalizadas"
            aria-describedby={`${titleId}-tip-jewelry`}
            onClick={(e) => {
              e.preventDefault();
              e.currentTarget.focus();
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <span aria-hidden={true}>?</span>
            <span
              id={`${titleId}-tip-jewelry`}
              role="tooltip"
              className="acompanamiento-inquiry-sheet__tip-bubble"
            >
              Piezas del catálogo de Maison Vigo para los novios (grabado, foto…). Máximo{" "}
              {MAX_INQUIRY_JEWELRY}. Es una solicitud; el precio es orientativo.
            </span>
          </button>
        </span>
      </label>

      {wantJewelry ? (
        <div className="acompanamiento-inquiry-sheet__jewelry-list">
          {value.map((item, index) => {
            const product = catalog.find((p) => p.id === item.productId);
            if (!product) return null;
            const pers = product.personalization;
            return (
              <div key={item.productId} className="acompanamiento-inquiry-sheet__jewelry-card">
                <div className="acompanamiento-inquiry-sheet__jewelry-card-head">
                  <p className="acompanamiento-inquiry-sheet__jewelry-name">{product.name}</p>
                  <button
                    type="button"
                    className="acompanamiento-inquiry-sheet__jewelry-remove"
                    onClick={() => onChange(value.filter((_, i) => i !== index))}
                  >
                    Quitar
                  </button>
                </div>
                <p className="acompanamiento-inquiry-sheet__hint">
                  {formatEur(item.unitPriceCents ?? product.salePriceCents)} · referencia
                </p>
                {product.variants.length > 0 ? (
                  <label className="acompanamiento-inquiry-sheet__field">
                    <span>Variante</span>
                    <select
                      value={item.variantKey ?? ""}
                      onChange={(e) => {
                        const key = e.target.value;
                        const v = product.variants.find((x) => variantKey(x.optionValues) === key);
                        if (!v) return;
                        updateItem(index, {
                          variantKey: key,
                          optionLabel: optionLabel(v.optionValues),
                          unitPriceCents: v.salePriceCents,
                        });
                      }}
                    >
                      {product.variants.map((v) => {
                        const key = variantKey(v.optionValues);
                        return (
                          <option key={key} value={key}>
                            {optionLabel(v.optionValues)} · {formatEur(v.salePriceCents)}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                ) : null}
                {pers?.enabled
                  ? (pers.textFields ?? []).map((field, fi) => (
                      <label key={field.label} className="acompanamiento-inquiry-sheet__field">
                        <span>
                          {field.label}
                          {field.required ? " *" : ""}
                        </span>
                        <input
                          value={item.customization?.texts?.[fi]?.value ?? ""}
                          maxLength={field.maxLength ?? undefined}
                          placeholder={field.placeholder ?? undefined}
                          onChange={(e) => {
                            const texts = [...(item.customization?.texts ?? [])];
                            while (texts.length <= fi) {
                              texts.push({
                                label: pers.textFields?.[texts.length]?.label ?? "",
                                value: "",
                              });
                            }
                            texts[fi] = { label: field.label, value: e.target.value };
                            updateItem(index, {
                              customization: { ...item.customization, texts },
                            });
                          }}
                        />
                      </label>
                    ))
                  : null}
                {pers?.enabled
                  ? (pers.photoFields ?? []).map((field, fi) => (
                      <label key={field.label} className="acompanamiento-inquiry-sheet__field">
                        <span>
                          {field.label}
                          {field.required ? " *" : ""}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            void postWebStoreCustomizationPhoto(file)
                              .then(({ url }) => {
                                const photos = [...(item.customization?.photos ?? [])];
                                while (photos.length <= fi) {
                                  photos.push({
                                    label: pers.photoFields?.[photos.length]?.label ?? "",
                                    url: "",
                                  });
                                }
                                photos[fi] = { label: field.label, url };
                                updateItem(index, {
                                  customization: { ...item.customization, photos },
                                });
                              })
                              .catch(() => {
                                /* ignore; sheet shows generic error on submit */
                              });
                          }}
                        />
                        {item.customization?.photos?.[fi]?.url ? (
                          <span className="acompanamiento-inquiry-sheet__hint">Foto lista</span>
                        ) : null}
                      </label>
                    ))
                  : null}
                {pers?.enabled
                  ? (pers.quantityTextGroups ?? []).map((group, gi) => {
                      const qty = item.customization?.quantityTextGroups?.[gi]?.quantity ?? group.minQuantity;
                      return (
                        <div key={group.label} className="acompanamiento-inquiry-sheet__jewelry-qty">
                          <label className="acompanamiento-inquiry-sheet__field">
                            <span>{group.label}</span>
                            <input
                              type="number"
                              min={group.minQuantity}
                              max={group.maxQuantity}
                              value={qty}
                              onChange={(e) => {
                                const n = Math.max(
                                  group.minQuantity,
                                  Math.min(group.maxQuantity, Math.round(Number(e.target.value)) || 0),
                                );
                                const groups = [...(item.customization?.quantityTextGroups ?? [])];
                                while (groups.length <= gi) {
                                  groups.push({
                                    label: pers.quantityTextGroups?.[groups.length]?.label ?? "",
                                    quantity: pers.quantityTextGroups?.[groups.length]?.minQuantity ?? 0,
                                    texts: [],
                                  });
                                }
                                const prevTexts = groups[gi]?.texts ?? [];
                                const texts = Array.from({ length: n }, (_, si) => ({
                                  label: formatQuantityTextSlotLabel(group.textLabelTemplate, si),
                                  value: prevTexts[si]?.value ?? "",
                                }));
                                groups[gi] = { label: group.label, quantity: n, texts };
                                updateItem(index, {
                                  customization: { ...item.customization, quantityTextGroups: groups },
                                });
                              }}
                            />
                          </label>
                          {Array.from({ length: qty }, (_, si) => (
                            <label key={si} className="acompanamiento-inquiry-sheet__field">
                              <span>{formatQuantityTextSlotLabel(group.textLabelTemplate, si)}</span>
                              <input
                                value={item.customization?.quantityTextGroups?.[gi]?.texts?.[si]?.value ?? ""}
                                placeholder={group.textPlaceholder ?? undefined}
                                onChange={(e) => {
                                  const groups = [...(item.customization?.quantityTextGroups ?? [])];
                                  const cur = groups[gi] ?? {
                                    label: group.label,
                                    quantity: qty,
                                    texts: [],
                                  };
                                  const texts = [...(cur.texts ?? [])];
                                  while (texts.length <= si) {
                                    texts.push({
                                      label: formatQuantityTextSlotLabel(group.textLabelTemplate, texts.length),
                                      value: "",
                                    });
                                  }
                                  texts[si] = {
                                    label: formatQuantityTextSlotLabel(group.textLabelTemplate, si),
                                    value: e.target.value,
                                  };
                                  groups[gi] = { ...cur, quantity: qty, texts };
                                  updateItem(index, {
                                    customization: { ...item.customization, quantityTextGroups: groups },
                                  });
                                }}
                              />
                            </label>
                          ))}
                        </div>
                      );
                    })
                  : null}
              </div>
            );
          })}

          {value.length < MAX_INQUIRY_JEWELRY ? (
            <label className="acompanamiento-inquiry-sheet__field">
              <span>Añadir joya</span>
              <select
                value={pickerId}
                onChange={(e) => addProduct(e.target.value)}
              >
                <option value="">— Elegir —</option>
                {available
                  .filter((p) => !value.some((v) => v.productId === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {formatEur(p.salePriceCents)}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
