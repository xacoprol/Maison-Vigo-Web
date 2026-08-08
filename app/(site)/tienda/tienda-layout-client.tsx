"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import "./tienda.css";

export default function TiendaLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname() || "";
  const compact =
    pathname.includes("/carrito") ||
    pathname.includes("/checkout") ||
    pathname.includes("/pedido");

  return (
    <div
      className={
        "tienda-page" + (compact ? " tienda-page--compact" : "")
      }
    >
      <div className="tienda-page__inner">{children}</div>
    </div>
  );
}
