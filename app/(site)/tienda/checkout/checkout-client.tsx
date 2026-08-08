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
import { legalCompany } from "@/lib/legal/company";
import {
  isCompleteEsPostalCode,
  normalizeEsPostalCode,
  provinceFromEsPostalCode,
  type EsPostalLookup,
} from "@/lib/es-postal";
import {
  WEB_STORE_LAST_CHECKOUT_KEY,
  formatEuroFromCents,
  fulfillmentMethodLabel,
  fulfillmentRequiresAddress,
  webStoreFileUrl,
} from "@/lib/web-store/utils";

import { useWebStoreCart } from "../web-store-cart";
import {
  TiendaLegalSheet,
  type TiendaLegalDoc,
} from "../tienda-legal-sheet";

const PICKUP_ADDRESS = `${legalCompany.address}. ${legalCompany.postalCode}, ${legalCompany.city}`;

type PayMethod = "card" | "bizum";
type LegalDocKey = "condiciones" | "privacidad";

type Props = {
  legalDocs: Record<LegalDocKey, TiendaLegalDoc>;
};

export default function TiendaCheckoutClient({ legalDocs }: Props) {
  const { lines, subtotalCents, hydrated } = useWebStoreCart();
  const [config, setConfig] = useState<WebStoreConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<WebStoreFulfillmentMethod>("pickup");
  const [payMethod, setPayMethod] = useState<PayMethod>("bizum");
  const [createWantAccount, setCreateWantAccount] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalLookupPending, setPostalLookupPending] = useState(false);
  const [legalDocKey, setLegalDocKey] = useState<LegalDocKey | null>(null);

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

  useEffect(() => {
    const code = normalizeEsPostalCode(postalCode);
    if (!isCompleteEsPostalCode(code)) {
      setCity("");
      setProvince("");
      setPostalLookupPending(false);
      return;
    }

    const provinceGuess = provinceFromEsPostalCode(code);
    if (provinceGuess) setProvince(provinceGuess);

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setPostalLookupPending(true);
        try {
          const res = await fetch(`/api/es-postal/${code}`);
          if (!res.ok || cancelled) return;
          const data = (await res.json()) as EsPostalLookup;
          if (cancelled) return;
          if (data.city) setCity(data.city);
          if (data.province) setProvince(data.province);
        } catch {
          // La provincia por prefijo ya se aplicó.
        } finally {
          if (!cancelled) setPostalLookupPending(false);
        }
      })();
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [postalCode]);

  const needsAddress = fulfillmentRequiresAddress(fulfillmentMethod);
  const locationUnlocked = isCompleteEsPostalCode(postalCode);
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
        email: null,
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
        {lines.map((line) => {
          const extra = line.personalizationExtraCents ?? 0;
          return (
          <li key={line.lineId} className="tienda-checkout__line">
            <div className="tienda-checkout__line-media">
              {line.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={line.imageUrl} alt="" />
              ) : (
                <span className="tienda-checkout__line-media-empty" aria-hidden>
                  —
                </span>
              )}
              <span className="tienda-checkout__line-qty">{line.quantity}</span>
            </div>
            <div className="tienda-checkout__line-meta">
              <p className="tienda-checkout__line-name">{line.name}</p>
              {line.optionLabel ? (
                <p className="tienda-checkout__line-opt">{line.optionLabel}</p>
              ) : null}
              {line.customization?.texts?.some((t) => t.value) ||
              line.customization?.photos?.some((p) => p.url) ||
              line.customization?.quantityTextGroups?.some(
                (g) => g.quantity > 0,
              ) ? (
                <ul className="tienda-checkout__line-custom">
                  {line.customization.texts?.map((text, index) =>
                    text.value ? (
                      <li key={`${text.label}-${index}`}>
                        <span className="tienda-checkout__line-custom-label">
                          {text.label}:
                        </span>{" "}
                        {text.value}
                      </li>
                    ) : null,
                  )}
                  {line.customization.quantityTextGroups?.map((group, gi) =>
                    group.quantity > 0 ? (
                      <li key={`qty-${group.label}-${gi}`}>
                        <span className="tienda-checkout__line-custom-label">
                          {group.label} ({group.quantity})
                        </span>
                        {group.texts?.some((t) => t.value) ? (
                          <ul className="tienda-checkout__line-custom-nested">
                            {group.texts.map((text, ti) =>
                              text.value ? (
                                <li key={`${text.label}-${ti}`}>
                                  <span className="tienda-checkout__line-custom-label">
                                    {text.label}:
                                  </span>{" "}
                                  {text.value}
                                </li>
                              ) : null,
                            )}
                          </ul>
                        ) : null}
                      </li>
                    ) : null,
                  )}
                </ul>
              ) : null}
              {line.customization?.photos?.some((p) => p.url) ? (
                <div className="tienda-checkout__line-photos">
                  {line.customization.photos.map((photo, index) =>
                    photo.url ? (
                      <div
                        key={`photo-${photo.label}-${index}`}
                        className="tienda-checkout__line-photo"
                        title={photo.label}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={webStoreFileUrl(photo.url)}
                          alt={photo.label}
                        />
                      </div>
                    ) : null,
                  )}
                </div>
              ) : null}
              <p className="tienda-checkout__line-unit">
                {formatEuroFromCents(line.salePriceCents)}
              </p>
              {extra > 0 ? (
                <p className="tienda-checkout__line-extra">
                  {formatEuroFromCents(line.salePriceCents - extra)} +{" "}
                  {formatEuroFromCents(extra)} pers.
                </p>
              ) : null}
            </div>
            <p className="tienda-checkout__line-price">
              {formatEuroFromCents(line.salePriceCents * line.quantity)}
            </p>
          </li>
          );
        })}
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
        <h1 className="tienda-checkout__sr-only">Checkout</h1>

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
              <div className="tienda-field tienda-field--float tienda-field--with-tip">
                <input
                  id="ws-phone"
                  className="tienda-input"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="Teléfono / WhatsApp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <label htmlFor="ws-phone">Teléfono / WhatsApp</label>
                <button
                  type="button"
                  className="tienda-field-tip"
                  aria-label="Información sobre el teléfono"
                  aria-describedby="ws-phone-tip"
                  onClick={(e) => e.preventDefault()}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <span aria-hidden={true}>?</span>
                  <span
                    id="ws-phone-tip"
                    role="tooltip"
                    className="tienda-tip__bubble tienda-tip__bubble--field"
                  >
                    En caso de que tengamos que contactarte sobre tu pedido.
                    Te confirmamos el pedido por WhatsApp en este número.
                  </span>
                </button>
              </div>
              <label className="tienda-check">
                <input
                  type="checkbox"
                  checked={createWantAccount}
                  onChange={(e) => setCreateWantAccount(e.target.checked)}
                />
                <span>
                  Quiero crear mi cuenta{" "}
                  <button
                    type="button"
                    className="tienda-tip"
                    aria-describedby="ws-mvcare-tip"
                    onClick={(e) => e.preventDefault()}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    MV Care
                    <span
                      id="ws-mvcare-tip"
                      role="tooltip"
                      className="tienda-tip__bubble"
                    >
                      MV Care es tu espacio digital privado y gratuito en Maison
                      Vigo: citas, historial y recomendaciones entre visitas.
                    </span>
                  </button>{" "}
                  con este teléfono.
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
                          ? PICKUP_ADDRESS
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
                <div className="tienda-field tienda-field--float">
                  <input
                    id="ws-first"
                    className="tienda-input"
                    required
                    autoComplete="given-name"
                    placeholder="Nombre"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <label htmlFor="ws-first">Nombre</label>
                </div>
                <div className="tienda-field tienda-field--float">
                  <input
                    id="ws-last"
                    className="tienda-input"
                    autoComplete="family-name"
                    placeholder="Apellidos"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <label htmlFor="ws-last">Apellidos</label>
                </div>
              </div>

              {needsAddress ? (
                <>
                  <div className="tienda-field tienda-field--float">
                    <input
                      id="ws-address"
                      className="tienda-input"
                      required
                      autoComplete="street-address"
                      placeholder="Dirección"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                    />
                    <label htmlFor="ws-address">Dirección</label>
                  </div>
                  <div className="tienda-form__grid tienda-form__grid--3">
                    <div className="tienda-field tienda-field--float">
                      <input
                        id="ws-postal"
                        className="tienda-input"
                        required
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="Código postal"
                        maxLength={5}
                        value={postalCode}
                        onChange={(e) =>
                          setPostalCode(normalizeEsPostalCode(e.target.value))
                        }
                      />
                      <label htmlFor="ws-postal">Código postal</label>
                    </div>
                    <div
                      className={
                        "tienda-field tienda-field--float" +
                        (locationUnlocked ? "" : " is-locked")
                      }
                    >
                      <input
                        id="ws-city"
                        className="tienda-input"
                        required={locationUnlocked}
                        autoComplete="address-level2"
                        placeholder={locationUnlocked ? "Ciudad" : " "}
                        value={city}
                        readOnly={!locationUnlocked}
                        onChange={(e) => setCity(e.target.value)}
                        aria-busy={postalLookupPending}
                      />
                      <label htmlFor="ws-city">Ciudad</label>
                      {!locationUnlocked ? (
                        <span className="tienda-field__lock-hint" aria-hidden={true}>
                          Se rellena con el CP
                        </span>
                      ) : null}
                    </div>
                    <div
                      className={
                        "tienda-field tienda-field--float" +
                        (locationUnlocked ? "" : " is-locked")
                      }
                    >
                      <input
                        id="ws-province"
                        className="tienda-input"
                        required={locationUnlocked}
                        autoComplete="address-level1"
                        placeholder={locationUnlocked ? "Provincia" : " "}
                        value={province}
                        readOnly={!locationUnlocked}
                        onChange={(e) => setProvince(e.target.value)}
                        aria-busy={postalLookupPending}
                      />
                      <label htmlFor="ws-province">Provincia</label>
                      {!locationUnlocked ? (
                        <span className="tienda-field__lock-hint" aria-hidden={true}>
                          Se rellena con el CP
                        </span>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </section>

          <section className="tienda-checkout__section">
            <h2 className="tienda-checkout__section-title">Pago</h2>
            <p className="tienda-checkout__section-note">
              Todas las transacciones son seguras y están encriptadas.
            </p>
            <div
              className="tienda-checkout__method-list"
              role="radiogroup"
              aria-label="Método de pago"
            >
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
                <span className="tienda-checkout__card-brands" aria-hidden={true}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="tienda-checkout__card-brand tienda-checkout__card-brand--bizum"
                    src="/assets/images/iconos/bizum.svg"
                    alt=""
                    width={61}
                    height={18}
                  />
                </span>
              </button>
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
                <span className="tienda-checkout__card-brands" aria-hidden={true}>
                  <svg
                    className="tienda-checkout__card-brand"
                    viewBox="0 0 48 32"
                    width="38"
                    height="24"
                  >
                    <rect width="48" height="32" rx="4" fill="#1A1F71" />
                    <text
                      x="24"
                      y="20.5"
                      textAnchor="middle"
                      fill="#fff"
                      fontFamily="Arial, Helvetica, sans-serif"
                      fontSize="11"
                      fontWeight="700"
                      letterSpacing="0.5"
                    >
                      VISA
                    </text>
                  </svg>
                  <svg
                    className="tienda-checkout__card-brand"
                    viewBox="0 0 48 32"
                    width="38"
                    height="24"
                  >
                    <rect width="48" height="32" rx="4" fill="#252525" />
                    <circle cx="19" cy="16" r="8.5" fill="#EB001B" />
                    <circle cx="29" cy="16" r="8.5" fill="#F79E1B" />
                    <path
                      fill="#FF5F00"
                      d="M24 9.6a8.5 8.5 0 0 0 0 12.8 8.5 8.5 0 0 0 0-12.8z"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </section>

          <p className="tienda-checkout__legal">
            Al pagar aceptas las{" "}
            <button
              type="button"
              className="tienda-checkout__legal-link"
              onClick={() => setLegalDocKey("condiciones")}
            >
              condiciones generales
            </button>{" "}
            y la{" "}
            <button
              type="button"
              className="tienda-checkout__legal-link"
              onClick={() => setLegalDocKey("privacidad")}
            >
              política de privacidad
            </button>
            .
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

      <TiendaLegalSheet
        doc={legalDocKey ? legalDocs[legalDocKey] : null}
        open={Boolean(legalDocKey)}
        onClose={() => setLegalDocKey(null)}
      />
    </div>
  );
}
