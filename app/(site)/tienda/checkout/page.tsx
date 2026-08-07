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
        const first = cfg.fulfillmentMethods[0] ?? "pickup";
        setFulfillmentMethod(first);
      } catch (err) {
        if (cancelled) return;
        setConfigError(
          err instanceof WebStoreRequestError
            ? err.message || err.code
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
      : (["pickup", "shipping", "local_delivery"] as WebStoreFulfillmentMethod[]);
    return list;
  }, [config]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!lines.length || pending) return;
    setError(null);
    setPending(true);
    try {
      if (needsAddress) {
        if (!addressLine.trim() || !postalCode.trim() || !city.trim() || !province.trim()) {
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
        <p className="tienda-eyebrow">Checkout</p>
        <h1 className="tienda-title">Finalizar compra</h1>
        <p className="tienda-status">
          No hay productos en el carrito.{" "}
          <Link href="/tienda" className="tienda-link">
            Ir al catálogo
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <p className="tienda-eyebrow">Checkout</p>
      <h1 className="tienda-title">Finalizar compra</h1>
      <p className="tienda-lead">
        Sin registro obligatorio. Indica tus datos para el pedido. Si quieres,
        puedes pedir crear tu cuenta MV Care.
      </p>

      {configError ? (
        <p className="tienda-status tienda-status--error">{configError}</p>
      ) : null}

      <div className="tienda-summary">
        <div className="tienda-summary__row">
          <span>Subtotal</span>
          <span>{formatEuroFromCents(subtotalCents)}</span>
        </div>
        <div className="tienda-summary__row">
          <span>Envío</span>
          <span>
            {needsAddress
              ? formatEuroFromCents(shippingCents)
              : "Incluido en recogida"}
          </span>
        </div>
        <div className="tienda-summary__row tienda-summary__row--total">
          <span>Total</span>
          <strong>{formatEuroFromCents(totalCents)}</strong>
        </div>
      </div>

      <form className="tienda-form" onSubmit={onSubmit}>
        <div className="tienda-field">
          <span className="tienda-label">Entrega</span>
          <div className="tienda-variants">
            {methods.map((method) => (
              <button
                key={method}
                type="button"
                className={
                  "tienda-chip" +
                  (fulfillmentMethod === method ? " is-selected" : "")
                }
                onClick={() => setFulfillmentMethod(method)}
              >
                {fulfillmentMethodLabel(method)}
              </button>
            ))}
          </div>
          {config?.carriers?.length && needsAddress ? (
            <p className="tienda-note">
              Transporte: {config.carriers.join(", ")}
            </p>
          ) : null}
        </div>

        <div className="tienda-form__grid tienda-form__grid--2">
          <div className="tienda-field">
            <label htmlFor="ws-first">Nombre *</label>
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

        <div className="tienda-form__grid tienda-form__grid--2">
          <div className="tienda-field">
            <label htmlFor="ws-email">Email *</label>
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
            <label htmlFor="ws-phone">Teléfono *</label>
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

        {needsAddress ? (
          <>
            <div className="tienda-field">
              <label htmlFor="ws-address">Dirección *</label>
              <input
                id="ws-address"
                className="tienda-input"
                required
                autoComplete="street-address"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
              />
            </div>
            <div className="tienda-form__grid tienda-form__grid--2">
              <div className="tienda-field">
                <label htmlFor="ws-postal">Código postal *</label>
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
                <label htmlFor="ws-city">Ciudad *</label>
                <input
                  id="ws-city"
                  className="tienda-input"
                  required
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>
            <div className="tienda-field">
              <label htmlFor="ws-province">Provincia *</label>
              <input
                id="ws-province"
                className="tienda-input"
                required
                autoComplete="address-level1"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              />
            </div>
          </>
        ) : null}

        <label className="tienda-check">
          <input
            type="checkbox"
            checked={createWantAccount}
            onChange={(e) => setCreateWantAccount(e.target.checked)}
          />
          <span>
            Quiero crear mi cuenta MV Care con este teléfono (te ayudaremos a
            activarla después).
          </span>
        </label>

        <div className="tienda-field">
          <span className="tienda-label">Pago</span>
          <div className="tienda-pay-methods">
            <button
              type="button"
              className={
                "tienda-chip" + (payMethod === "card" ? " is-selected" : "")
              }
              onClick={() => setPayMethod("card")}
            >
              Tarjeta
            </button>
            <button
              type="button"
              className={
                "tienda-chip" + (payMethod === "bizum" ? " is-selected" : "")
              }
              onClick={() => setPayMethod("bizum")}
            >
              Bizum
            </button>
          </div>
        </div>

        <p className="tienda-note">
          Al pagar aceptas las{" "}
          <Link href="/condiciones-generales">condiciones generales de compra</Link>{" "}
          y la{" "}
          <Link href="/privacidad">política de privacidad</Link>.
        </p>

        {error ? (
          <p className="tienda-status tienda-status--error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="tienda-btn tienda-btn--solid"
          disabled={pending || Boolean(configError)}
        >
          {pending ? "Redirigiendo al pago…" : "Pagar ahora"}
        </button>
      </form>
    </>
  );
}
