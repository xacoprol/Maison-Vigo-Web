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
import {
  postWebStoreOrderLookup,
  WebStoreRequestError,
} from "@/lib/web-store/api";
import type { WebStoreOrderTrack } from "@/lib/web-store/types";
import {
  formatEuroFromCents,
  webStoreFileUrl,
} from "@/lib/web-store/utils";

import { WaveText } from "./wave-text";

import "./tienda-order-track-banner.css";

const EXIT_MS = 520;

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

type ProgressStep = { id: string; label: string };

function progressStepsFor(fulfillmentMethod: string): ProgressStep[] {
  if (fulfillmentMethod === "shipping") {
    return [
      { id: "paid", label: "Recibido" },
      { id: "preparing", label: "Preparación" },
      { id: "shipped", label: "Enviado" },
      { id: "completed", label: "Completado" },
    ];
  }
  if (fulfillmentMethod === "local_delivery") {
    return [
      { id: "paid", label: "Recibido" },
      { id: "preparing", label: "Preparación" },
      { id: "out_for_delivery", label: "Reparto" },
      { id: "completed", label: "Completado" },
    ];
  }
  return [
    { id: "paid", label: "Recibido" },
    { id: "preparing", label: "Preparación" },
    { id: "ready_for_pickup", label: "Recogida" },
    { id: "completed", label: "Completado" },
  ];
}

function showsProgress(status: string) {
  return [
    "paid",
    "preparing",
    "ready_for_pickup",
    "out_for_delivery",
    "shipped",
    "completed",
  ].includes(status);
}

function stepState(
  stepId: string,
  status: string,
  steps: ProgressStep[],
): "done" | "current" | "todo" {
  const idx = steps.findIndex((s) => s.id === stepId);
  const cur = steps.findIndex((s) => s.id === status);
  if (status === "completed") return "done";
  if (cur < 0) return "todo";
  if (idx < cur) return "done";
  if (idx === cur) return "current";
  return "todo";
}

function formatOrderDate(iso: string | null) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function TiendaOrderTrackBanner() {
  const pathname = usePathname() || "";
  if (!isTiendaPath(pathname)) return null;
  if (
    pathname === "/tienda/checkout" ||
    pathname.startsWith("/tienda/checkout/")
  ) {
    return null;
  }
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
  const [pending, setPending] = useState(false);
  const [tracked, setTracked] = useState<WebStoreOrderTrack | null>(null);
  const orderInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const grabberRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const closeModalRef = useRef<() => void>(() => {});

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
      setPending(false);
      setTracked(null);
      closeTimer.current = null;
    }, EXIT_MS);
  }, []);

  closeModalRef.current = closeModal;

  useEffect(() => {
    if (!open) return;
    lockScroll();
    setMounted(true);
    setVisible(false);
    let frame2 = 0;
    const frame1 = window.requestAnimationFrame(() => {
      frame2 = window.requestAnimationFrame(() => setVisible(true));
    });
    const focusTimer = window.setTimeout(() => {
      orderInputRef.current?.focus();
    }, 80);
    return () => {
      window.cancelAnimationFrame(frame1);
      if (frame2) window.cancelAnimationFrame(frame2);
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

  /* Arrastre nativo (touch + pointer): mismo patrón que la ficha de producto. */
  useEffect(() => {
    if (!mounted || !visible) return;
    const handle = grabberRef.current;
    const panel = panelRef.current;
    if (!handle || !panel) return;

    type DragState = {
      startY: number;
      lastY: number;
      lastTs: number;
      dy: number;
      velocity: number;
      pointerId: number | null;
    };
    let drag: DragState | null = null;

    const backdrop = () =>
      panel.parentElement?.querySelector(".tienda-order-track-modal__backdrop");

    const startDrag = (clientY: number, pointerId: number | null) => {
      drag = {
        startY: clientY,
        lastY: clientY,
        lastTs: performance.now(),
        dy: 0,
        velocity: 0,
        pointerId,
      };
      panel.classList.add("tienda-order-track-modal__panel--dragging");
      panel.style.transition = "none";
    };

    const moveDrag = (clientY: number) => {
      if (!drag) return;
      const now = performance.now();
      const dt = Math.max(1, now - drag.lastTs);
      drag.velocity = (clientY - drag.lastY) / dt;
      drag.lastY = clientY;
      drag.lastTs = now;
      const dy = Math.max(0, clientY - drag.startY);
      drag.dy = dy;
      panel.style.transform = `translate3d(0, ${dy}px, 0)`;
      const bd = backdrop();
      if (bd instanceof HTMLElement) {
        bd.style.opacity = String(Math.max(0.22, 1 - dy / 420));
      }
    };

    const endDrag = () => {
      if (!drag) return;
      const { dy, velocity } = drag;
      drag = null;
      const shouldClose = dy > 96 || (dy > 40 && velocity > 0.35);

      const bd = backdrop();
      if (bd instanceof HTMLElement) bd.style.opacity = "";

      panel.classList.remove("tienda-order-track-modal__panel--dragging");
      panel.style.transition = "";

      if (shouldClose) {
        panel.style.transform = "translate3d(0, 104%, 0)";
        closeModalRef.current();
        return;
      }
      panel.style.transform = "translate3d(0, 0, 0)";
      window.setTimeout(() => {
        if (
          panelRef.current === panel &&
          !panel.classList.contains("tienda-order-track-modal__panel--dragging")
        ) {
          panel.style.transform = "";
        }
      }, EXIT_MS);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      startDrag(event.touches[0]!.clientY, null);
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!drag || event.touches.length !== 1) return;
      event.preventDefault();
      moveDrag(event.touches[0]!.clientY);
    };
    const onTouchEnd = () => endDrag();

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (event.button !== 0) return;
      handle.setPointerCapture(event.pointerId);
      startDrag(event.clientY, event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      moveDrag(event.clientY);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (handle.hasPointerCapture(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId);
      }
      endDrag();
    };

    handle.addEventListener("touchstart", onTouchStart, { passive: true });
    handle.addEventListener("touchmove", onTouchMove, { passive: false });
    handle.addEventListener("touchend", onTouchEnd);
    handle.addEventListener("touchcancel", onTouchEnd);
    handle.addEventListener("pointerdown", onPointerDown);
    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", onPointerUp);
    handle.addEventListener("pointercancel", onPointerUp);

    return () => {
      handle.removeEventListener("touchstart", onTouchStart);
      handle.removeEventListener("touchmove", onTouchMove);
      handle.removeEventListener("touchend", onTouchEnd);
      handle.removeEventListener("touchcancel", onTouchEnd);
      handle.removeEventListener("pointerdown", onPointerDown);
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", onPointerUp);
      handle.removeEventListener("pointercancel", onPointerUp);
      drag = null;
    };
  }, [mounted, visible]);

  useEffect(() => {
    if (!visible) {
      const panel = panelRef.current;
      if (panel) {
        panel.style.transform = "";
        panel.style.transition = "";
        panel.classList.remove("tienda-order-track-modal__panel--dragging");
      }
    }
  }, [visible]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const ref = normalizeStoreOrderRef(orderSuffix);
    const phoneDigits = digitsOnly(phone);

    if (!/^MV\d{4,}$/.test(ref)) {
      setError("Revisa la referencia.");
      return;
    }
    if (phoneDigits.length < 9) {
      setError("Revisa el teléfono.");
      return;
    }

    setError(null);
    setPending(true);
    try {
      const data = await postWebStoreOrderLookup({
        storeOrderRef: ref,
        phone: phone.trim(),
      });
      setTracked(data);
    } catch (err) {
      if (err instanceof WebStoreRequestError) {
        if (err.status === 404) {
          setError("No encontramos ese pedido con esos datos.");
        } else if (err.status === 429) {
          setError("Demasiados intentos. Espera un momento.");
        } else {
          setError("No se pudo consultar el pedido. Inténtalo de nuevo.");
        }
      } else {
        setError("No se pudo consultar el pedido. Inténtalo de nuevo.");
      }
    } finally {
      setPending(false);
    }
  }

  const trackedSteps = tracked
    ? progressStepsFor(tracked.fulfillmentMethod)
    : [];
  const trackedDate = tracked ? formatOrderDate(tracked.createdAt) : null;

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
              ref={panelRef}
              className={
                "tienda-order-track-modal__panel" +
                (tracked ? " tienda-order-track-modal__panel--result" : "")
              }
              role="dialog"
              aria-modal="true"
              aria-labelledby={tracked ? undefined : titleId}
              aria-label={tracked ? `Pedido ${tracked.storeOrderRef}` : undefined}
            >
              <header className="tienda-order-track-modal__header">
                <div
                  ref={grabberRef}
                  className="tienda-order-track-modal__grabber"
                  role="button"
                  tabIndex={0}
                  aria-label="Arrastra hacia abajo para cerrar"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      closeModal();
                    }
                  }}
                >
                  <span
                    className="tienda-order-track-modal__grabber-bar"
                    aria-hidden={true}
                  />
                </div>
                <button
                  type="button"
                  className="tienda-order-track-modal__close"
                  aria-label="Cerrar"
                  onClick={closeModal}
                >
                  ×
                </button>
              </header>

              <div
                className={
                  "tienda-order-track-modal__body" +
                  (tracked ? " tienda-order-track-modal__body--result" : "")
                }
              >
                {tracked ? (
                  <div className="tienda-order-track-result">
                    <div className="tienda-order-track-result__top">
                      <p className="tienda-order-track-result__ref">
                        {tracked.storeOrderRef}
                      </p>
                      {trackedDate ? (
                        <p className="tienda-order-track-result__date">
                          {trackedDate}
                        </p>
                      ) : null}
                    </div>

                    {showsProgress(tracked.status) ? (
                      <ol
                        className="tienda-order-track-progress"
                        aria-label="Estado del pedido"
                      >
                        {trackedSteps.map((step) => {
                          const state = stepState(
                            step.id,
                            tracked.status,
                            trackedSteps,
                          );
                          return (
                            <li
                              key={step.id}
                              className={
                                "tienda-order-track-progress__step" +
                                ` tienda-order-track-progress__step--${state}`
                              }
                            >
                              <span
                                className="tienda-order-track-progress__dot"
                                aria-hidden
                              />
                              <span className="tienda-order-track-progress__label">
                                {step.label}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    ) : (
                      <p
                        className={
                          "tienda-order-track-result__badge" +
                          (tracked.status === "cancelled"
                            ? " tienda-order-track-result__badge--muted"
                            : "")
                        }
                      >
                        {tracked.statusLabel}
                      </p>
                    )}

                    <p className="tienda-order-track-result__fulfillment">
                      {tracked.fulfillmentLabel}
                    </p>

                    <ul className="tienda-order-track-result__lines">
                      {tracked.lines.map((line, i) => {
                        const img = webStoreFileUrl(line.imageUrl);
                        return (
                          <li
                            key={`${line.name}-${i}`}
                            className="tienda-order-track-result__line"
                          >
                            <div className="tienda-order-track-result__thumb">
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={img} alt="" />
                              ) : (
                                <span aria-hidden>◇</span>
                              )}
                            </div>
                            <div className="tienda-order-track-result__line-copy">
                              <p className="tienda-order-track-result__line-name">
                                {line.name}
                              </p>
                              {line.optionLabel ? (
                                <p className="tienda-order-track-result__line-opt">
                                  {line.optionLabel}
                                </p>
                              ) : null}
                              <p className="tienda-order-track-result__line-qty">
                                {line.quantity} ×{" "}
                                {formatEuroFromCents(line.salePriceCents)}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {tracked.shippingCents > 0 ? (
                      <p className="tienda-order-track-result__ship">
                        Envío: {formatEuroFromCents(tracked.shippingCents)}
                      </p>
                    ) : null}

                    {tracked.trackingNumber ? (
                      <p className="tienda-order-track-result__tracking">
                        Seguimiento
                        {tracked.carrier ? ` (${tracked.carrier})` : ""}:{" "}
                        <strong>{tracked.trackingNumber}</strong>
                      </p>
                    ) : null}

                    <div className="tienda-order-track-result__total">
                      <span>Total</span>
                      <strong>
                        {formatEuroFromCents(tracked.totalCents)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="tienda-order-track-modal__submit mob-link--wave"
                      onClick={() => {
                        setTracked(null);
                        setError(null);
                        window.setTimeout(
                          () => orderInputRef.current?.focus(),
                          40,
                        );
                      }}
                    >
                      <WaveText text="Consultar otro" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2
                      id={titleId}
                      className="tienda-order-track-modal__title"
                    >
                      Seguir tu pedido
                    </h2>
                    <form
                      className="tienda-order-track-modal__form"
                      onSubmit={onSubmit}
                      noValidate
                    >
                      <div className="tienda-order-track-modal__field">
                        <label htmlFor={orderId}>Referencia</label>
                        <div className="tienda-order-track-modal__order">
                          <span
                            className="tienda-order-track-modal__prefix"
                            aria-hidden
                          >
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
                          />
                        </div>
                      </div>

                      <div className="tienda-order-track-modal__field">
                        <label htmlFor={phoneId}>Teléfono</label>
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
                        <p
                          className="tienda-order-track-modal__error"
                          role="alert"
                        >
                          {error}
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        className="tienda-order-track-modal__submit mob-link--wave"
                        disabled={pending}
                      >
                        <WaveText
                          text={pending ? "Consultando…" : "Consultar"}
                        />
                      </button>
                    </form>
                  </>
                )}
              </div>
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
