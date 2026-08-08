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

/* ── Validación (misma lógica que @maisonvigo/shared Care) ─────────────── */

const PERSONALIZATION_TEXT_MAX_LENGTH_CAP = 500;
const PERSONALIZATION_QUANTITY_TEXT_MAX_PER_GROUP = 20;

export type WebStorePersonalizationConfig = {
  enabled: boolean;
  textFields: NonNullable<NonNullable<WebStorePersonalization>["textFields"]>;
  photoFields: NonNullable<NonNullable<WebStorePersonalization>["photoFields"]>;
  quantityTextGroups: NonNullable<
    NonNullable<WebStorePersonalization>["quantityTextGroups"]
  >;
  requireAtLeastOneTextOrPhoto?: boolean;
  textAndPhotoExtraPriceCents?: number | null;
};

export type PersonalizationFieldErrorCode =
  | "required"
  | "max_length"
  | "min_quantity"
  | "require_text_or_photo";

export type PersonalizationFieldError = {
  fieldKind: "text" | "photo" | "quantity_text" | "text_or_photo";
  fieldIndex: number;
  code: PersonalizationFieldErrorCode;
  label: string;
  maxLength?: number;
  minQuantity?: number;
};

export function webStorePersonalizationConfig(
  personalization: WebStorePersonalization,
): WebStorePersonalizationConfig | null {
  if (!personalization || personalization.enabled === false) return null;
  const textFields = personalization.textFields ?? [];
  const photoFields = personalization.photoFields ?? [];
  const quantityTextGroups = personalization.quantityTextGroups ?? [];
  if (
    textFields.length === 0 &&
    photoFields.length === 0 &&
    quantityTextGroups.length === 0
  ) {
    return null;
  }
  return {
    enabled: true,
    textFields,
    photoFields,
    quantityTextGroups,
    requireAtLeastOneTextOrPhoto: personalization.requireAtLeastOneTextOrPhoto,
    textAndPhotoExtraPriceCents: personalization.textAndPhotoExtraPriceCents,
  };
}

export function normalizePersonalizationTextMaxLength(
  raw: unknown,
): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(n, PERSONALIZATION_TEXT_MAX_LENGTH_CAP);
}

export function normalizeQuantityTextGroupBounds(
  minRaw: unknown,
  maxRaw: unknown,
): { minQuantity: number; maxQuantity: number } {
  let minQuantity = Math.round(Number(minRaw ?? 0));
  let maxQuantity = Math.round(
    Number(maxRaw ?? PERSONALIZATION_QUANTITY_TEXT_MAX_PER_GROUP),
  );
  if (!Number.isFinite(minQuantity) || minQuantity < 0) minQuantity = 0;
  if (!Number.isFinite(maxQuantity) || maxQuantity < 1) {
    maxQuantity = Math.max(1, minQuantity || 1);
  }
  minQuantity = Math.min(
    minQuantity,
    PERSONALIZATION_QUANTITY_TEXT_MAX_PER_GROUP,
  );
  maxQuantity = Math.min(
    Math.max(maxQuantity, minQuantity > 0 ? minQuantity : 1),
    PERSONALIZATION_QUANTITY_TEXT_MAX_PER_GROUP,
  );
  return { minQuantity, maxQuantity };
}

function fieldLabelForMessage(label: string): string {
  const t = String(label ?? "").trim();
  return t || "este detalle";
}

/** Mensaje legible — mismo copy que Care. */
export function personalizationFieldErrorMessage(
  error: PersonalizationFieldError,
): string {
  const name = fieldLabelForMessage(error.label);
  if (error.code === "min_quantity") {
    const min = error.minQuantity ?? 1;
    return `Elige al menos ${min} ${min === 1 ? "unidad" : "unidades"} de «${name}».`;
  }
  if (error.code === "require_text_or_photo") {
    return "Indica un texto o sube una foto para personalizar tu pedido.";
  }
  if (error.code === "required") {
    if (error.fieldKind === "photo") {
      return `Sube la imagen de «${name}» para poder continuar.`;
    }
    return `Indica «${name}» — lo necesitamos para personalizar tu pedido.`;
  }
  return `«${name}» admite como máximo ${error.maxLength ?? 0} caracteres.`;
}

/** Lista todos los campos pendientes o incorrectos (idéntico a Care). */
export function listPersonalizationCustomizationErrors(
  config: WebStorePersonalizationConfig | null | undefined,
  customization: WebStoreCartCustomization,
): PersonalizationFieldError[] {
  if (!config?.enabled) return [];
  const out: PersonalizationFieldError[] = [];
  const texts = customization?.texts ?? [];
  for (let i = 0; i < config.textFields.length; i++) {
    const field = config.textFields[i]!;
    const value = String(texts[i]?.value ?? "").trim();
    const label = String(field.label ?? "").trim() || "Texto";
    if (field.required && !value) {
      out.push({ fieldKind: "text", fieldIndex: i, code: "required", label });
      continue;
    }
    const max = normalizePersonalizationTextMaxLength(field.maxLength);
    if (max != null && value.length > max) {
      out.push({
        fieldKind: "text",
        fieldIndex: i,
        code: "max_length",
        label,
        maxLength: max,
      });
    }
  }
  const photos = customization?.photos ?? [];
  for (let i = 0; i < config.photoFields.length; i++) {
    const field = config.photoFields[i]!;
    const label = String(field.label ?? "").trim() || "Foto";
    if (field.required && !String(photos[i]?.url ?? "").trim()) {
      out.push({ fieldKind: "photo", fieldIndex: i, code: "required", label });
    }
  }
  if (
    config.requireAtLeastOneTextOrPhoto === true &&
    config.textFields.length > 0 &&
    config.photoFields.length > 0 &&
    !hasAnyFixedText(config, customization) &&
    !hasAnyFixedPhoto(config, customization)
  ) {
    out.push({
      fieldKind: "text_or_photo",
      fieldIndex: 0,
      code: "require_text_or_photo",
      label: "Texto o foto",
    });
  }
  const qtyCustomization = customization?.quantityTextGroups ?? [];
  for (let gi = 0; gi < config.quantityTextGroups.length; gi++) {
    const field = config.quantityTextGroups[gi]!;
    const groupLabel = String(field.label ?? "").trim() || "Cantidad";
    const { minQuantity, maxQuantity } = normalizeQuantityTextGroupBounds(
      field.minQuantity,
      field.maxQuantity,
    );
    let quantity = Math.round(Number(qtyCustomization[gi]?.quantity ?? 0));
    if (!Number.isFinite(quantity) || quantity < 0) quantity = 0;
    if (quantity > maxQuantity) quantity = maxQuantity;

    if (quantity < minQuantity) {
      out.push({
        fieldKind: "quantity_text",
        fieldIndex: gi,
        code: "min_quantity",
        label: groupLabel,
        minQuantity,
      });
      continue;
    }

    const slotTexts = qtyCustomization[gi]?.texts ?? [];
    for (let si = 0; si < quantity; si++) {
      const slotLabel = formatQuantityTextSlotLabel(field.textLabelTemplate, si);
      const value = String(slotTexts[si]?.value ?? "").trim();
      if (field.required !== false && quantity > 0 && !value) {
        out.push({
          fieldKind: "quantity_text",
          fieldIndex: gi * 1000 + si,
          code: "required",
          label: slotLabel,
        });
        continue;
      }
      const max = normalizePersonalizationTextMaxLength(field.maxLength);
      if (max != null && value.length > max) {
        out.push({
          fieldKind: "quantity_text",
          fieldIndex: gi * 1000 + si,
          code: "max_length",
          label: slotLabel,
          maxLength: max,
        });
      }
    }
  }
  return out;
}

export function parseQuantityTextFieldErrorIndex(fieldIndex: number): {
  groupIndex: number;
  slotIndex: number;
} {
  if (fieldIndex >= 1000) {
    return {
      groupIndex: Math.floor(fieldIndex / 1000),
      slotIndex: fieldIndex % 1000,
    };
  }
  return { groupIndex: fieldIndex, slotIndex: 0 };
}

/** Mapea errores Care → claves del formulario Web. */
export function personalizationErrorsToFieldMap(
  errors: PersonalizationFieldError[],
  config: WebStorePersonalizationConfig,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const err of errors) {
    const msg = personalizationFieldErrorMessage(err);
    if (err.fieldKind === "text") {
      const label = config.textFields[err.fieldIndex]?.label ?? err.label;
      out[label] = msg;
    } else if (err.fieldKind === "photo") {
      const label = config.photoFields[err.fieldIndex]?.label ?? err.label;
      out[`photo:${label}`] = msg;
    } else if (err.fieldKind === "text_or_photo") {
      if (config.textFields[0]) out[config.textFields[0].label] = msg;
      if (config.photoFields[0]) {
        out[`photo:${config.photoFields[0].label}`] = msg;
      }
    } else if (err.fieldKind === "quantity_text") {
      if (err.code === "min_quantity") {
        out[`qty:${err.fieldIndex}`] = msg;
      } else {
        const { groupIndex, slotIndex } = parseQuantityTextFieldErrorIndex(
          err.fieldIndex,
        );
        out[quantityTextSlotKey(groupIndex, slotIndex)] = msg;
      }
    }
  }
  return out;
}

export function personalizationErrorFocusId(
  error: PersonalizationFieldError,
  config: WebStorePersonalizationConfig,
): string | null {
  if (error.fieldKind === "text") {
    const label = config.textFields[error.fieldIndex]?.label;
    return label ? `sheet-pers-${label}` : null;
  }
  if (error.fieldKind === "photo") {
    const label = config.photoFields[error.fieldIndex]?.label;
    return label ? `sheet-photo-${label}` : null;
  }
  if (error.fieldKind === "text_or_photo") {
    if (config.textFields[0]?.label) {
      return `sheet-pers-${config.textFields[0].label}`;
    }
    if (config.photoFields[0]?.label) {
      return `sheet-photo-${config.photoFields[0].label}`;
    }
    return null;
  }
  if (error.code === "min_quantity") {
    return `sheet-qty-${error.fieldIndex}`;
  }
  const { groupIndex, slotIndex } = parseQuantityTextFieldErrorIndex(
    error.fieldIndex,
  );
  return `sheet-qty-text-${quantityTextSlotKey(groupIndex, slotIndex)}`;
}
