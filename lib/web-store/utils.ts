/** Base pública del API Care (Railway). Sin barra final. */
export function careApiBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_CARE_API_BASE_URL?.trim() ||
    process.env.CARE_API_BASE_URL?.trim() ||
    "";
  return raw.replace(/\/$/, "");
}

export function webStoreApiRoot(): string {
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
