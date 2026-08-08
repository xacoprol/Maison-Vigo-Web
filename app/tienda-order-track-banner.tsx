"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

import { lockScroll, unlockScroll } from "@/lib/scroll-lock";
import { bookingUrl } from "@/lib/site-config";

import { WaveText } from "./wave-text";

import "./tienda-order-track-banner.css";

function isTiendaPath(pathname: string) {
  return pathname === "/tienda" || pathname.startsWith("/tienda/");
}

/** Normaliza a `MVxxxxxx` (acepta con o sin prefijo). */
function normalizeStoreOrderRef(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/[\s\-_./]/g, "");
  if (!cleaned) return "";
  return cleaned.startsWith("MV") ? cleaned : `MV${cleaned}`;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function misPedidosHref(storeOrderRef: string) {
  const url = new URL(bookingUrl);
  url.searchParams.set("pedidos", "1");
  url.searchParams.set("storeOrderRef", storeOrderRef);
  return url.toString();
}

export function TiendaOrderTrackBanner() {
  const pathname = usePathname() || "";
  if (!isTiendaPath(pathname)) return null;
  return <TiendaOrderTrackBannerInner />;
}

function TiendaOrderTrackBannerInner() {
  const titleId = useId();
  const orderId = useId();
  const phoneId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [orderSuffix, setOrderSuffix] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const orderInputRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const closeModal = useCallback(() => {
    setVisible(false);
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setMounted(false);
      setOpen(false);
      setError(null);
      closeTimer.current = null;
    }, 320);
  }, []);

  useEffect(() => {
    if (!open) return;
    lockScroll();
    setMounted(true);
    const raf = window.requestAnimationFrame(() => setVisible(true));
    const focusTimer = window.setTimeout(() => {
      orderInputRef.current?.focus();
    }, 80);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(focusTimer);
      unlockScroll();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const ref = normalizeStoreOrderRef(orderSuffix);
    const phoneDigits = digitsOnly(phone);

    if (!/^MV\d{4,}$/.test(ref)) {
      setError("Revisa el número de pedido (ej. 260018).");
      return;
    }
    if (phoneDigits.length < 9) {
      setError("Introduce el teléfono asociado al pedido.");
      return;
    }

    setError(null);
    window.location.assign(misPedidosHref(ref));
  }

  const modal =
    portalReady && mounted
      ? createPortal(
          <div
            className={
              "tienda-order-track-modal" +
              (visible ? " tienda-order-track-modal--visible" : "")
            }
            role="presentation"
          >
            <button
              type="button"
              className="tienda-order-track-modal__backdrop"
              aria-label="Cerrar"
              onClick={closeModal}
            />
            <div
              className="tienda-order-track-modal__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <button
                type="button"
                className="tienda-order-track-modal__close"
                aria-label="Cerrar"
                onClick={closeModal}
              >
                ×
              </button>
              <p className="tienda-order-track-modal__eyebrow">The Selection</p>
              <h2 id={titleId} className="tienda-order-track-modal__title">
                Seguir tu pedido
              </h2>
              <p className="tienda-order-track-modal__lead">
                Introduce el número de pedido y el teléfono con el que
                compraste. Te llevamos a Mis pedidos en MV Care.
              </p>
              <form
                className="tienda-order-track-modal__form"
                onSubmit={onSubmit}
                noValidate
              >
                <div className="tienda-order-track-modal__field">
                  <label htmlFor={orderId}>Número de pedido</label>
                  <div className="tienda-order-track-modal__order">
                    <span className="tienda-order-track-modal__prefix" aria-hidden>
                      MV
                    </span>
                    <input
                      ref={orderInputRef}
                      id={orderId}
                      className="tienda-order-track-modal__input"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="260018"
                      value={orderSuffix}
                      onChange={(e) => {
                        const next = e.target.value
                          .toUpperCase()
                          .replace(/^MV/i, "");
                        setOrderSuffix(next.replace(/[^\dA-Z]/gi, ""));
                        if (error) setError(null);
                      }}
                      aria-describedby={`${orderId}-hint`}
                    />
                  </div>
                  <span
                    id={`${orderId}-hint`}
                    className="tienda-order-track-modal__hint"
                  >
                    Solo la parte numérica; el prefijo MV va fijo.
                  </span>
                </div>

                <div className="tienda-order-track-modal__field">
                  <label htmlFor={phoneId}>Teléfono asociado</label>
                  <input
                    id={phoneId}
                    className="tienda-order-track-modal__input"
                    type="tel"
                    autoComplete="tel"
                    placeholder="600 000 000"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (error) setError(null);
                    }}
                  />
                </div>

                {error ? (
                  <p className="tienda-order-track-modal__error" role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="tienda-order-track-modal__submit mob-link--wave"
                >
                  <WaveText text="Ver mi pedido" />
                </button>
              </form>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <section
        className="tienda-order-track"
        aria-labelledby="tienda-order-track-title"
      >
        <div className="tienda-order-track__inner">
          <div className="tienda-order-track__copy">
            <p className="tienda-order-track__eyebrow">Pedidos</p>
            <h2
              id="tienda-order-track-title"
              className="tienda-order-track__title"
            >
              ¿Quieres seguir tu pedido?
            </h2>
            <p className="tienda-order-track__text">
              Consulta el estado de tu pedido introduciendo el número de
              referencia y el teléfono asociado a la compra.
            </p>
          </div>
          <button
            type="button"
            className="tienda-order-track__cta mob-link--wave"
            onClick={() => {
              if (closeTimer.current != null) {
                window.clearTimeout(closeTimer.current);
                closeTimer.current = null;
              }
              setOpen(true);
            }}
          >
            <WaveText text="Consultar pedido" />
          </button>
        </div>
      </section>
      {modal}
    </>
  );
}
