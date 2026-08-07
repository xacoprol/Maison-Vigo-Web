"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useWebStoreCart } from "./(site)/tienda/web-store-cart";

import "./tienda-cart-fab.css";

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden={true} className="tienda-cart-fab__icon">
      <path
        d="M6 6h15l-1.5 9h-12L6 6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6 6 5 3H2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="9.5" cy="19.5" r="1.25" fill="currentColor" />
      <circle cx="17.5" cy="19.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

export function TiendaCartFab() {
  const pathname = usePathname() || "";
  const { count, hydrated } = useWebStoreCart();
  const onCartPage = pathname.startsWith("/tienda/carrito");
  const visible = hydrated && count > 0 && !onCartPage;

  useEffect(() => {
    document.body.classList.toggle("tienda-cart-fab-visible", visible);
    return () => document.body.classList.remove("tienda-cart-fab-visible");
  }, [visible]);

  if (!visible) return null;

  return (
    <Link
      href="/tienda/carrito"
      className="tienda-cart-fab"
      aria-label={`Carrito, ${count} ${count === 1 ? "artículo" : "artículos"}`}
    >
      <IconCart />
      <span className="tienda-cart-fab__badge">
        {count > 99 ? "99+" : count}
      </span>
    </Link>
  );
}
