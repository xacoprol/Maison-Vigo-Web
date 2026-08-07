import type {
  WebStoreApiError,
  WebStoreCatalog,
  WebStoreCheckoutResult,
  WebStoreConfig,
  WebStoreOrderLookup,
  WebStoreRedsysSession,
} from "./types";
import { webStoreApiRoot } from "./utils";

export class WebStoreRequestError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message?: string) {
    super(message || code);
    this.name = "WebStoreRequestError";
    this.status = status;
    this.code = code;
  }
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function webStoreFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const root = webStoreApiRoot();
  if (!root) {
    throw new WebStoreRequestError(
      503,
      "api_not_configured",
      "Falta NEXT_PUBLIC_CARE_API_BASE_URL.",
    );
  }

  const res = await fetch(`${root}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = await parseJson(res);
  if (!res.ok) {
    const err = (data ?? {}) as WebStoreApiError;
    throw new WebStoreRequestError(
      res.status,
      err.error || "request_failed",
      err.message,
    );
  }
  return data as T;
}

export function fetchWebStoreCatalog(): Promise<WebStoreCatalog> {
  return webStoreFetch<WebStoreCatalog>("/catalog");
}

export function fetchWebStoreConfig(): Promise<WebStoreConfig> {
  return webStoreFetch<WebStoreConfig>("/config");
}

export type WebStoreCheckoutBody = {
  lines: Array<{
    productId: string;
    productKind: "catalog" | "kibble";
    quantity: number;
    name: string;
    salePriceCents: number;
    variantKey: string | null;
    optionLabel?: string | null;
    imageUrl?: string | null;
    customization: { texts?: { label: string; value: string }[] } | null;
  }>;
  fulfillmentMethod: "pickup" | "shipping" | "local_delivery";
  firstName: string;
  lastName?: string | null;
  email: string;
  phone: string;
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
  province?: string | null;
  createWantAccount?: boolean;
};

export function postWebStoreCheckout(
  body: WebStoreCheckoutBody,
): Promise<WebStoreCheckoutResult> {
  return webStoreFetch<WebStoreCheckoutResult>("/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function postWebStoreRedsysSession(input: {
  paymentId: string;
  storeOrderRef: string;
  payMethod: "card" | "bizum";
}): Promise<WebStoreRedsysSession> {
  return webStoreFetch<WebStoreRedsysSession>(
    `/payments/${encodeURIComponent(input.paymentId)}/redsys-session`,
    {
      method: "POST",
      body: JSON.stringify({
        storeOrderRef: input.storeOrderRef,
        payMethod: input.payMethod,
      }),
    },
  );
}

export function fetchWebStoreOrder(
  storeOrderRef: string,
  paymentId: string,
): Promise<WebStoreOrderLookup> {
  const q = new URLSearchParams({ token: paymentId });
  return webStoreFetch<WebStoreOrderLookup>(
    `/orders/${encodeURIComponent(storeOrderRef)}?${q.toString()}`,
  );
}
