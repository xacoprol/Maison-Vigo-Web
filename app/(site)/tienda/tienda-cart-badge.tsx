"use client";

import { useWebStoreCart } from "./web-store-cart";

export function TiendaCartBadge() {
  const { count, hydrated } = useWebStoreCart();
  if (!hydrated || count <= 0) return null;
  return <span aria-hidden="true">({count})</span>;
}
