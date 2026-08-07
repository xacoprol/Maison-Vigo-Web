import type {
  WebStoreCartCustomization,
  WebStorePersonalization,
  WebStorePersonalizationQuantityTextGroup,
  WebStoreProduct,
} from "./types";

const QTY_CAP = 20;

export function quantityTextSlotKey(groupIndex: number, slotIndex: number): string {
  return `${groupIndex}:${slotIndex}`;
}

export function formatQuantityTextSlotLabel(
  template: string | null | undefined,
  index: number,
): string {
  const t = String(template ?? "").trim() || "{{n}}";
  const n = Math.max(1, Math.round(index) + 1);
  return t.replace(/\{\{\s*n\s*\}\}/gi, String(n));
}

function fieldExtraCents(extra: number | null | undefined): number {
  const n = Math.round(Number(extra ?? 0));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function billableUnits(
  quantity: number,
  firstUnitIncludedInPrice: boolean | undefined,
): number {
  const q = Math.max(0, Math.round(Number(quantity)));
  if (q <= 0) return 0;
  if (firstUnitIncludedInPrice === true) return Math.max(0, q - 1);
  return q;
}

export function quantityTextGroupExtraCents(
  field: WebStorePersonalizationQuantityTextGroup,
  quantity: number,
): number {
  const extraPer = fieldExtraCents(field.extraPriceCentsPerUnit);
  if (extraPer <= 0) return 0;
  return extraPer * billableUnits(quantity, field.firstUnitIncludedInPrice);
}

function hasAnyFixedText(
  config: NonNullable<WebStorePersonalization>,
  customization: WebStoreCartCustomization,
): boolean {
  const texts = customization?.texts ?? [];
  for (let i = 0; i < (config.textFields?.length ?? 0); i++) {
    if (String(texts[i]?.value ?? "").trim()) return true;
  }
  return false;
}

function hasAnyFixedPhoto(
  config: NonNullable<WebStorePersonalization>,
  customization: WebStoreCartCustomization,
): boolean {
  const photos = customization?.photos ?? [];
  for (let i = 0; i < (config.photoFields?.length ?? 0); i++) {
    if (String(photos[i]?.url ?? "").trim()) return true;
  }
  return false;
}

/** Misma lógica que Care: extras por índice de campo. */
export function personalizationExtraCentsFromCustomization(
  config: WebStorePersonalization,
  customization: WebStoreCartCustomization,
): number {
  if (!config || config.enabled === false) return 0;
  let sum = 0;
  const texts = customization?.texts ?? [];
  const photos = customization?.photos ?? [];
  const textFields = config.textFields ?? [];
  const photoFields = config.photoFields ?? [];
  const qtyGroups = config.quantityTextGroups ?? [];

  for (let i = 0; i < textFields.length; i++) {
    const field = textFields[i]!;
    const extra = fieldExtraCents(field.extraPriceCents);
    if (extra <= 0) continue;
    const value = String(texts[i]?.value ?? "").trim();
    if (field.required === true || value) sum += extra;
  }
  for (let i = 0; i < photoFields.length; i++) {
    const field = photoFields[i]!;
    const extra = fieldExtraCents(field.extraPriceCents);
    if (extra <= 0) continue;
    const url = String(photos[i]?.url ?? "").trim();
    if (field.required === true || url) sum += extra;
  }
  const qtyValues = customization?.quantityTextGroups ?? [];
  for (let i = 0; i < qtyGroups.length; i++) {
    const field = qtyGroups[i]!;
    const q = Math.round(Number(qtyValues[i]?.quantity ?? 0));
    sum += quantityTextGroupExtraCents(field, q);
  }
  const bothExtra = fieldExtraCents(config.textAndPhotoExtraPriceCents);
  if (
    bothExtra > 0 &&
    textFields.length > 0 &&
    photoFields.length > 0 &&
    hasAnyFixedText(config, customization) &&
    hasAnyFixedPhoto(config, customization)
  ) {
    sum += bothExtra;
  }
  return sum;
}

function maxFromComponentBudget(
  componentUnitBudget: number,
  group: WebStorePersonalizationQuantityTextGroup,
): number {
  const minQuantity = Math.max(0, Math.round(Number(group.minQuantity ?? 0)));
  const maxQuantity = Math.min(
    QTY_CAP,
    Math.max(1, Math.round(Number(group.maxQuantity ?? QTY_CAP))),
  );
  const budget = Math.max(0, Math.floor(componentUnitBudget));
  if (group.firstUnitIncludedInPrice === true) {
    return Math.min(maxQuantity, Math.max(minQuantity, budget + 1));
  }
  return Math.min(maxQuantity, Math.max(minQuantity, budget));
}

/**
 * Tope de unidades del grupo enlazado al stock del componente (huellas).
 * Sin carrito concurrente: presupuesto = stock del componente.
 */
export function maxQuantityTextGroupFromLinkedStock(
  product: WebStoreProduct,
  groupIndex: number,
): number | null {
  const group = product.personalization?.quantityTextGroups?.[groupIndex];
  if (!group) return null;
  if (product.linkedStockQuantityTextGroupIndex !== groupIndex) return null;
  if (!product.linkedStockProductId) return null;
  const componentStock = product.linkedStockProductStock;
  if (componentStock == null || !Number.isFinite(componentStock)) return null;
  const perBracelet = Math.max(1, Math.round(Number(product.linkedStockUnitsPerSale ?? 1)));
  const budget = Math.floor(Math.max(0, componentStock) / perBracelet);
  return maxFromComponentBudget(budget, group);
}

export function hasCustomizationContent(
  customization: WebStoreCartCustomization,
): boolean {
  if (!customization) return false;
  if (customization.texts?.some((t) => String(t.value ?? "").trim())) return true;
  if (customization.photos?.some((p) => String(p.url ?? "").trim())) return true;
  if (
    customization.quantityTextGroups?.some(
      (g) =>
        Math.round(Number(g.quantity ?? 0)) > 0 ||
        g.texts?.some((t) => String(t.value ?? "").trim()),
    )
  ) {
    return true;
  }
  return false;
}

/** True si el producto puede sumar suplementos de personalización. */
export function productHasPricedPersonalization(
  personalization: WebStorePersonalization,
): boolean {
  if (!personalization || personalization.enabled === false) return false;
  if (fieldExtraCents(personalization.textAndPhotoExtraPriceCents) > 0) return true;
  for (const field of personalization.textFields ?? []) {
    if (fieldExtraCents(field.extraPriceCents) > 0) return true;
  }
  for (const field of personalization.photoFields ?? []) {
    if (fieldExtraCents(field.extraPriceCents) > 0) return true;
  }
  for (const group of personalization.quantityTextGroups ?? []) {
    if (fieldExtraCents(group.extraPriceCentsPerUnit) > 0) return true;
  }
  return false;
}

/**
 * Extra mínimo al abrir la ficha (campos required con suplemento +
 * cantidad mínima de grupos, respetando «1.ª incluida»).
 */
export function minPersonalizationExtraCents(
  personalization: WebStorePersonalization,
): number {
  if (!personalization || personalization.enabled === false) return 0;
  let sum = 0;
  for (const field of personalization.textFields ?? []) {
    if (field.required === true) sum += fieldExtraCents(field.extraPriceCents);
  }
  for (const field of personalization.photoFields ?? []) {
    if (field.required === true) sum += fieldExtraCents(field.extraPriceCents);
  }
  for (const group of personalization.quantityTextGroups ?? []) {
    sum += quantityTextGroupExtraCents(group, group.minQuantity ?? 0);
  }
  return sum;
}
