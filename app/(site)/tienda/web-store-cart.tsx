"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { WebStoreCartLine, WebStoreProduct } from "@/lib/web-store/types";
import {
  WEB_STORE_CART_KEY,
  variantCombinationKey,
  variantOptionLabel,
  webStoreFileUrl,
} from "@/lib/web-store/utils";

type AddOptions = {
  variantKey: string | null;
  quantity?: number;
  customization?: WebStoreCartLine["customization"];
  optionLabel?: string | null;
};

type CartContextValue = {
  lines: WebStoreCartLine[];
  count: number;
  subtotalCents: number;
  hydrated: boolean;
  addProduct: (product: WebStoreProduct, options: AddOptions) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStored(): WebStoreCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WEB_STORE_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is WebStoreCartLine =>
        Boolean(row) &&
        typeof row === "object" &&
        typeof (row as WebStoreCartLine).lineId === "string" &&
        typeof (row as WebStoreCartLine).productId === "string",
    );
  } catch {
    return [];
  }
}

function lineIdFor(
  productId: string,
  variantKey: string | null,
  customization: WebStoreCartLine["customization"],
): string {
  const personalized = Boolean(customization?.texts?.length);
  if (personalized) {
    return `${productId}::${variantKey ?? "_"}::${crypto.randomUUID()}`;
  }
  return `${productId}::${variantKey ?? "_"}`;
}

function resolveUnitPrice(
  product: WebStoreProduct,
  variantKey: string | null,
): number {
  if (variantKey) {
    const v = product.variants.find(
      (item) => variantCombinationKey(item.optionValues) === variantKey,
    );
    if (v) return v.salePriceCents;
  }
  return product.salePriceCents;
}

function resolveStock(
  product: WebStoreProduct,
  variantKey: string | null,
): number | null {
  if (variantKey) {
    const v = product.variants.find(
      (item) => variantCombinationKey(item.optionValues) === variantKey,
    );
    if (v) return v.stockQuantity;
  }
  return product.stockQuantity;
}

export function WebStoreCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<WebStoreCartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(readStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(WEB_STORE_CART_KEY, JSON.stringify(lines));
    } catch {
      /* ignore quota */
    }
  }, [lines, hydrated]);

  const addProduct = useCallback((product: WebStoreProduct, options: AddOptions) => {
    const variantKey = options.variantKey;
    const qty = Math.max(1, Math.min(99, options.quantity ?? 1));
    const customization = options.customization ?? null;
    const id = lineIdFor(product.id, variantKey, customization);
    const salePriceCents = resolveUnitPrice(product, variantKey);
    const stockQuantity = resolveStock(product, variantKey);
    const optionLabel =
      options.optionLabel ??
      (variantKey
        ? variantOptionLabel(
            product.variants.find(
              (v) => variantCombinationKey(v.optionValues) === variantKey,
            )?.optionValues ?? {},
          )
        : null);
    const imageUrl = webStoreFileUrl(product.photos[0]?.url) || null;

    setLines((prev) => {
      if (!customization?.texts?.length) {
        const existing = prev.find((l) => l.lineId === id);
        if (existing) {
          const nextQty = Math.min(99, existing.quantity + qty);
          return prev.map((l) =>
            l.lineId === id ? { ...l, quantity: nextQty } : l,
          );
        }
      }
      const next: WebStoreCartLine = {
        lineId: id,
        productId: product.id,
        productKind: product.kind,
        name: product.name,
        optionLabel,
        imageUrl,
        salePriceCents,
        quantity: qty,
        variantKey,
        customization,
        stockQuantity,
      };
      return [...prev, next];
    });
  }, []);

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    const q = Math.max(0, Math.min(99, Math.round(quantity)));
    setLines((prev) => {
      if (q <= 0) return prev.filter((l) => l.lineId !== lineId);
      return prev.map((l) => (l.lineId === lineId ? { ...l, quantity: q } : l));
    });
  }, []);

  const removeLine = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotalCents = lines.reduce(
      (sum, l) => sum + l.salePriceCents * l.quantity,
      0,
    );
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    return {
      lines,
      count,
      subtotalCents,
      hydrated,
      addProduct,
      setQuantity,
      removeLine,
      clear,
    };
  }, [lines, hydrated, addProduct, setQuantity, removeLine, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useWebStoreCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useWebStoreCart debe usarse dentro de WebStoreCartProvider");
  }
  return ctx;
}
