/** Base pública del API Care (Railway). Sin barra final. */
export function careApiBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_CARE_API_BASE_URL?.trim() ||
    process.env.CARE_API_BASE_URL?.trim() ||
    "";
  return raw.replace(/\/$/, "");
}

/**
 * Raíz del API web-store.
 * En el navegador usamos el proxy same-origin `/api/web-store` (evita CORS).
 * En servidor llamamos directo a Care.
 */
export function webStoreApiRoot(): string {
  if (typeof window !== "undefined") {
    return "/api/web-store";
  }
  const base = careApiBaseUrl();
  if (!base) return "";
  return `${base}/public/web-store`;
}

/** URL absoluta de foto de catálogo (`/files/...` → API Care). */
export function webStoreFileUrl(relativePath: string | null | undefined): string {
  if (!relativePath) return "";
  const s = relativePath.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const base = careApiBaseUrl();
  if (!base) return s.startsWith("/") ? s : `/${s}`;
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${base}${path}`;
}

export function formatEuroFromCents(cents: number): string {
  const n = Number.isFinite(cents) ? cents : 0;
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(n / 100);
}

/** PVP efectivo de variante: sin precio propio (> 0) hereda el del producto. */
export function effectiveVariantSalePriceCents(
  variantSalePriceCents: number | null | undefined,
  baseSalePriceCents: number,
): number {
  const v = Math.round(Number(variantSalePriceCents ?? 0));
  if (v > 0) return v;
  return Math.round(Number(baseSalePriceCents ?? 0));
}

/** Rango de PVP visible (base o variantes activas con precio > 0). */
export function storeProductSalePriceRange(product: {
  salePriceCents: number;
  variants?: { salePriceCents?: number | null }[];
}): { min: number; max: number } {
  const base = Math.round(Number(product.salePriceCents ?? 0));
  const variants = product.variants ?? [];
  if (variants.length > 0) {
    const prices = variants
      .map((v) => effectiveVariantSalePriceCents(v.salePriceCents, base))
      .filter((p) => p > 0);
    if (prices.length > 0) {
      return { min: Math.min(...prices), max: Math.max(...prices) };
    }
  }
  return { min: base, max: base };
}

/**
 * Etiqueta de precio en tarjeta (como Care): null si no hay PVP,
 * «Desde …» si hay rango entre variantes.
 */
export function formatProductPriceLabel(product: {
  salePriceCents: number;
  variants?: { salePriceCents?: number | null }[];
}): string | null {
  const { min, max } = storeProductSalePriceRange(product);
  if (min <= 0) return null;
  if ((product.variants?.length ?? 0) > 0 && min !== max) {
    return `Desde ${formatEuroFromCents(min)}`;
  }
  return formatEuroFromCents(min);
}

/** Título de tarjeta pienso/húmeda: marca · variedad (sin kg del eje Peso). */
export function kibbleCardDisplayName(product: {
  kind?: string;
  name: string;
  brand?: string | null;
  variety?: string | null;
}): string {
  if (product.kind !== "kibble") return product.name;
  const brand = String(product.brand ?? "").trim();
  const variety = String(product.variety ?? "").trim();
  const parts = [brand, variety].filter(Boolean);
  return parts.length ? parts.join(" · ") : product.name;
}

/** Misma clave de variante que Care (`variantCombinationKey`). */
export function variantCombinationKey(optionValues: Record<string, string>): string {
  return Object.keys(optionValues)
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((k) => `${k}\x01${optionValues[k]}`)
    .join("\x01");
}

export function variantOptionLabel(optionValues: Record<string, string>): string {
  return Object.keys(optionValues)
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((k) => `${k}: ${optionValues[k]}`)
    .join(" · ");
}

export const WEB_STORE_CART_KEY = "mv-web-store-cart-v1";
export const WEB_STORE_LAST_CHECKOUT_KEY = "mv-web-store-last-checkout";

export function fulfillmentMethodLabel(method: string): string {
  switch (method) {
    case "shipping":
      return "Envío a domicilio";
    case "local_delivery":
      return "Entrega local";
    case "pickup":
    default:
      return "Recogida en Maison Vigo";
  }
}

export function fulfillmentRequiresAddress(method: string): boolean {
  return method === "shipping" || method === "local_delivery" || method === "delivery";
}
