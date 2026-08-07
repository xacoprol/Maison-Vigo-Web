"use client";

import { useSearchParams } from "next/navigation";

export function PagoKoClient() {
  const search = useSearchParams();
  const storeOrderRef = (search.get("storeOrderRef") ?? "").trim();
  if (!storeOrderRef) return null;
  return (
    <div className="tienda-summary">
      <div className="tienda-summary__row">
        <span>Referencia</span>
        <strong>{storeOrderRef}</strong>
      </div>
    </div>
  );
}
