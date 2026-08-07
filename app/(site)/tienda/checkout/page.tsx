"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  fetchWebStoreConfig,
  postWebStoreCheckout,
  postWebStoreRedsysSession,
  WebStoreRequestError,
} from "@/lib/web-store/api";
import { submitRedsysForm } from "@/lib/web-store/redsys-submit";
import type { WebStoreConfig, WebStoreFulfillmentMethod } from "@/lib/web-store/types";
import {
  WEB_STORE_LAST_CHECKOUT_KEY,
  formatEuroFromCents,
  fulfillmentMethodLabel,
  fulfillmentRequiresAddress,
} from "@/lib/web-store/utils";

import { useWebStoreCart } from "../web-store-cart";

type PayMethod = "card" | "bizum";

export default function TiendaCheckoutPage() {
  const { lines, subtotalCents, hydrated, clear } = useWebStoreCart();
  const [config, setConfig] = useState<WebStoreConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<WebStoreFulfillmentMethod>("pickup");
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [createWantAccount, setCreateWantAccount] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const cfg = await fetchWebStoreConfig();
        if (cancelled) return;
        setConfig(cfg);
        const allowed = (cfg.fulfillmentMethods ?? []).filter(
          (method) => method !== "local_delivery",
        );
        const first = allowed[0] ?? "pickup";
        setFulfillmentMethod(first);
      } catch (err) {
        if (cancelled) return;
        const detail =
          err instanceof WebStoreRequestError
            ? err.message || err.code
            : err instanceof Error
              ? err.message
              : null;
        setConfigError(
          detail && detail !== "request_failed"
            ? detail
            : "No se pudo cargar la configuración de envío.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const needsAddress = fulfillmentRequiresAddress(fulfillmentMethod);
  const shippingCents =
    needsAddress && config ? config.deliveryShippingCents : 0;
  const totalCents = subtotalCents + shippingCents;

  const methods = useMemo(() => {
    const list = config?.fulfillmentMethods?.length
      ? config.fulfillmentMethods
      : (["pickup", "shipping"] as WebStoreFulfillmentMethod[]);
    return list.filter((method) => method !== "local_delivery");
  }, [config]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!lines.length || pending) return;
    setError(null);
    setPending(true);
    try {
      if (needsAddress) {
        if (
          !addressLine.trim() ||
          !postalCode.trim() ||
          !city.trim() ||
          !province.trim()
        ) {
          throw new Error("Completa la dirección de envío.");
        }
      }
      if (!config?.redsysConfigured) {
        throw new Error("El pago online no está disponible ahora mismo.");
      }

      const checkout = await postWebStoreCheckout({
        lines: lines.map((line) => ({
          productId: line.productId,
          productKind: line.productKind,
          quantity: line.quantity,
          name: line.name,
          salePriceCents: line.salePriceCents,
          variantKey: line.variantKey,
          optionLabel: line.optionLabel,
          imageUrl: line.imageUrl,
          customization: line.customization,
        })),
        fulfillmentMethod,
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
        email: email.trim(),
        phone: phone.trim(),
        addressLine: needsAddress ? addressLine.trim() : null,
        postalCode: needsAddress ? postalCode.trim() : null,
        city: needsAddress ? city.trim() : null,
        province: needsAddress ? province.trim() : null,
        createWantAccount,
      });

      try {
        window.sessionStorage.setItem(
          WEB_STORE_LAST_CHECKOUT_KEY,
          JSON.stringify({
            paymentId: checkout.paymentId,
            storeOrderRef: checkout.storeOrderRef,
          }),
        );
      } catch {
        /* ignore */
      }

      const session = await postWebStoreRedsysSession({
        paymentId: checkout.paymentId,
        storeOrderRef: checkout.storeOrderRef,
        payMethod,
      });

      clear();
      submitRedsysForm(session.tpvUrl, session.fields);
    } catch (err) {
      const message =
        err instanceof WebStoreRequestError
          ? err.message || err.code
          : err instanceof Error
            ? err.message
            : "No se pudo iniciar el pago.";
      setError(message);
      setPending(false);
    }
  };

  if (!hydrated) {
    return <p className="tienda-status">Cargando…</p>;
  }

  if (!lines.length) {
    return (
      <>
        <h1 className="tienda-title">Checkout</h1>
        <p className="tienda-status">
          No hay productos en el carrito.{" "}
          <Link href="/tienda" className="tienda-link">
            Ir al catálogo
          </Link>
        </p>
      </>
    );
  }

  const summaryBody = (
    <>
      <ul className="tienda-checkout__lines">
        {lines.map((line) => (
          <li key={line.lineId} className="tienda-checkout__line">
            <div className="tienda-checkout__line-media">
              {line.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.imageUrl} alt="" />
              ) : null}
              <span className="tienda-checkout__line-qty">{line.quantity}</span>
            </div>
            <div className="tienda-checkout__line-meta">
              <p className="tienda-checkout__line-name">{line.name}</p>
              {line.optionLabel ? (
                <p className="tienda-checkout__line-opt">{line.optionLabel}</p>
              ) : null}
              {line.customization?.texts?.length ? (
                <ul className="tienda-checkout__line-custom">
                  {line.customization.texts.map((text, index) =>
                    text.value ? (
                      <li key={`${text.label}-${index}`}>
                        {text.label}: {text.value}
                      </li>
                    ) : null,
                  )}
                </ul>
              ) : null}
            </div>
            <p className="tienda-checkout__line-price">
              {formatEuroFromCents(line.salePriceCents * line.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="tienda-checkout__totals">
        <div className="tienda-checkout__total-row">
          <span>Subtotal</span>
          <span>{formatEuroFromCents(subtotalCents)}</span>
        </div>
        <div className="tienda-checkout__total-row">
          <span>Envío</span>
          <span>
            {needsAddress
              ? formatEuroFromCents(shippingCents)
              : "Gratis"}
          </span>
        </div>
        <div className="tienda-checkout__total-row tienda-checkout__total-row--grand">
          <span>Total</span>
          <strong>{formatEuroFromCents(totalCents)}</strong>
        </div>
      </div>
    </>
  );

  return (
    <div className="tienda-checkout">
      <div className="tienda-checkout__main">
        <header className="tienda-checkout__header">
          <p className="tienda-eyebrow">The Selection</p>
          <h1 className="tienda-checkout__title">Checkout</h1>
          <Link href="/tienda/carrito" className="tienda-checkout__back">
            ← Volver al carrito
          </Link>
        </header>

        {configError ? (
          <p className="tienda-status tienda-status--error">{configError}</p>
        ) : null}

        <div className="tienda-checkout__mobile-summary">
          <button
            type="button"
            className="tienda-checkout__mobile-summary-toggle"
            aria-expanded={summaryOpen}
            onClick={() => setSummaryOpen((v) => !v)}
          >
            <span>{summaryOpen ? "Ocultar resumen" : "Mostrar resumen"}</span>
            <strong>{formatEuroFromCents(totalCents)}</strong>
          </button>
          {summaryOpen ? (
            <div className="tienda-checkout__mobile-summary-body">
              {summaryBody}
            </div>
          ) : null}
        </div>

        <form className="tienda-checkout__form" onSubmit={onSubmit}>
          <section className="tienda-checkout__section">
            <h2 className="tienda-checkout__section-title">Contacto</h2>
            <div className="tienda-checkout__fields">
              <div className="tienda-form__grid tienda-form__grid--2">
                <div className="tienda-field">
                  <label htmlFor="ws-email">Email</label>
                  <input
                    id="ws-email"
                    className="tienda-input"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="tienda-field">
                  <label htmlFor="ws-phone">Teléfono</label>
                  <input
                    id="ws-phone"
                    className="tienda-input"
                    type="tel"
                    required
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              <label className="tienda-check">
                <input
                  type="checkbox"
                  checked={createWantAccount}
                  onChange={(e) => setCreateWantAccount(e.target.checked)}
                />
                <span>
                  Quiero crear mi cuenta MV Care con este teléfono.
                </span>
              </label>
            </div>
          </section>

          <section className="tienda-checkout__section">
            <h2 className="tienda-checkout__section-title">Entrega</h2>
            <div
              className="tienda-checkout__method-list"
              role="radiogroup"
              aria-label="Método de entrega"
            >
              {methods.map((method) => {
                const selected = fulfillmentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={
                      "tienda-checkout__method" +
                      (selected ? " is-selected" : "")
                    }
                    onClick={() => setFulfillmentMethod(method)}
                  >
                    <span className="tienda-checkout__method-radio" />
                    <span className="tienda-checkout__method-copy">
                      <span className="tienda-checkout__method-name">
                        {fulfillmentMethodLabel(method)}
                      </span>
                      <span className="tienda-checkout__method-hint">
                        {method === "pickup"
                          ? "Sin coste de envío"
                          : config?.carriers?.length
                            ? config.carriers.join(", ")
                            : "A domicilio"}
                      </span>
                    </span>
                    <span className="tienda-checkout__method-price">
                      {method === "pickup"
                        ? "Gratis"
                        : formatEuroFromCents(
                            config?.deliveryShippingCents ?? 0,
                          )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="tienda-checkout__fields">
              <div className="tienda-form__grid tienda-form__grid--2">
                <div className="tienda-field">
                  <label htmlFor="ws-first">Nombre</label>
                  <input
                    id="ws-first"
                    className="tienda-input"
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="tienda-field">
                  <label htmlFor="ws-last">Apellidos</label>
                  <input
                    id="ws-last"
                    className="tienda-input"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              {needsAddress ? (
                <>
                  <div className="tienda-field">
                    <label htmlFor="ws-address">Dirección</label>
                    <input
                      id="ws-address"
                      className="tienda-input"
                      required
                      autoComplete="street-address"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                    />
                  </div>
                  <div className="tienda-form__grid tienda-form__grid--3">
                    <div className="tienda-field">
                      <label htmlFor="ws-postal">Código postal</label>
                      <input
                        id="ws-postal"
                        className="tienda-input"
                        required
                        autoComplete="postal-code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                      />
                    </div>
                    <div className="tienda-field">
                      <label htmlFor="ws-city">Ciudad</label>
                      <input
                        id="ws-city"
                        className="tienda-input"
                        required
                        autoComplete="address-level2"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div className="tienda-field">
                      <label htmlFor="ws-province">Provincia</label>
                      <input
                        id="ws-province"
                        className="tienda-input"
                        required
                        autoComplete="address-level1"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </section>

          <section className="tienda-checkout__section">
            <h2 className="tienda-checkout__section-title">Pago</h2>
            <div
              className="tienda-checkout__method-list"
              role="radiogroup"
              aria-label="Método de pago"
            >
              <button
                type="button"
                role="radio"
                aria-checked={payMethod === "card"}
                className={
                  "tienda-checkout__method" +
                  (payMethod === "card" ? " is-selected" : "")
                }
                onClick={() => setPayMethod("card")}
              >
                <span className="tienda-checkout__method-radio" />
                <span className="tienda-checkout__method-copy">
                  <span className="tienda-checkout__method-name">Tarjeta</span>
                  <span className="tienda-checkout__method-hint">
                    Visa, Mastercard y más
                  </span>
                </span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={payMethod === "bizum"}
                className={
                  "tienda-checkout__method" +
                  (payMethod === "bizum" ? " is-selected" : "")
                }
                onClick={() => setPayMethod("bizum")}
              >
                <span className="tienda-checkout__method-radio" />
                <span className="tienda-checkout__method-copy">
                  <span className="tienda-checkout__method-name">Bizum</span>
                  <span className="tienda-checkout__method-hint">
                    Pago instantáneo con tu banco
                  </span>
                </span>
              </button>
            </div>
          </section>

          <p className="tienda-checkout__legal">
            Al pagar aceptas las{" "}
            <Link href="/condiciones-generales">condiciones generales</Link> y
            la <Link href="/privacidad">política de privacidad</Link>.
          </p>

          {error ? (
            <p className="tienda-status tienda-status--error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="tienda-btn tienda-btn--solid tienda-checkout__pay"
            disabled={pending || Boolean(configError)}
          >
            {pending
              ? "Redirigiendo al pago…"
              : `Pagar ahora · ${formatEuroFromCents(totalCents)}`}
          </button>
        </form>
      </div>

      <aside className="tienda-checkout__aside" aria-label="Resumen del pedido">
        <div className="tienda-checkout__aside-inner">{summaryBody}</div>
      </aside>
    </div>
  );
}
