import Image from "next/image";
import Link from "next/link";

import { bookingUrl } from "@/lib/site-config";

import { CareAssist } from "./care-assist";
import { ReservaCtaLabel } from "./reserva-cta-label";
import { WaveText } from "./wave-text";

/**
 * UI persistente que se monta en el `RootLayout`: navbar, menú móvil,
 * panel de reserva, banner de cookies y orientación IA (+ WhatsApp).
 * Los handlers interactivos viven en `<SiteEffects />`.
 */
export function SiteShell() {
  return (
    <>
      <div
        className="cookie-banner cookie-banner--awaiting cookie-banner--hidden"
        id="cookieBanner"
        role="dialog"
        aria-live="polite"
        aria-label="Consentimiento de cookies"
        aria-hidden="true"
      >
        <p className="cookie-banner-text">
          Este sitio recopila{" "}
          <a href="/cookies" className="cookie-banner-link mob-link--wave">
            <WaveText text="cookies" />
          </a>
          .
        </p>
        <div className="cookie-banner-actions">
          <button
            type="button"
            id="cookieAccept"
            className="cookie-banner-btn mob-link--wave"
          >
            <WaveText text="Aceptar" />
          </button>
          <button
            type="button"
            id="cookieReject"
            className="cookie-banner-btn cookie-banner-btn--ghost mob-link--wave"
          >
            <WaveText text="Rechazar" />
          </button>
        </div>
      </div>

      <CareAssist />

      <nav id="navbar">
        <div className="nav-start">
          <button
            type="button"
            className="hamburger"
            id="hamburger"
            aria-label="Abrir menú principal"
            aria-controls="mobileMenu"
            aria-expanded="false"
          >
            <span className="hamburger-label mob-link--wave">
              <WaveText text="Menú" />
            </span>
            <img
              src="/assets/images/iconos/menu.svg"
              alt=""
              className="hamburger-icon"
              aria-hidden={true}
            />
          </button>
        </div>
        <Link href="/" className="nav-brand" aria-label="Maison Vigo — inicio">
          <div className="nav-brand-anim" aria-hidden={true}>
            <img
              src="/logo-anim/anim-1.svg"
              alt=""
              width={236}
              height={212}
              className="nav-brand-piece nav-brand-piece--one"
            />
            <img
              src="/logo-anim/anim-2.svg"
              alt=""
              width={538}
              height={55}
              className="nav-brand-piece nav-brand-piece--two"
            />
            <img
              src="/logo-anim/anim-3.svg"
              alt=""
              width={340}
              height={27}
              className="nav-brand-piece nav-brand-piece--three"
            />
          </div>
        </Link>
        <div className="nav-end">
          <a
            href="/#contacto"
            className="nav-cta mob-link--wave js-open-reserva-panel"
            id="openReservaPanel"
            aria-label="Reserva una cita"
          >
            <ReservaCtaLabel compactOnMobile />
          </a>
        </div>
      </nav>

      <div className="mobile-menu" id="mobileMenu" aria-hidden="true">
        <div className="mobile-menu-panel">
          <div className="mobile-menu-inner">
            <div className="mobile-menu-primary">
              <a
                href="/#concepto"
                className="mob-link mob-link--primary"
                data-menu-image="foto1"
              >
                Concepto
              </a>
              <a
                href="/#espacio"
                className="mob-link mob-link--primary"
                data-menu-image="foto3"
              >
                El espacio
              </a>
              <a
                href="/#servicios"
                className="mob-link mob-link--primary"
                data-menu-image="foto2"
              >
                Cuidado integral
              </a>
              <Link
                href="/mvcare"
                className="mob-link mob-link--primary"
                data-menu-image="mvcare"
              >
                MV CARE
              </Link>
            </div>

            <div className="mobile-menu-secondary">
              <Link
                href="/tienda"
                className="mob-link mob-link--secondary mob-link--wave"
              >
                <WaveText text="The Selection" />
              </Link>
            </div>

            <div className="mobile-menu-assist">
              <p className="mobile-menu-assist-title">
                ¿Qué necesita tu perro?
              </p>
              <button
                type="button"
                className="mobile-menu-assist-cta js-open-care-assist"
              >
                Oriéntame
              </button>
            </div>
          </div>
        </div>

        <div className="mobile-menu-media" aria-hidden={true}>
            <div className="mobile-menu-media-frame">
              <div
                className="mobile-menu-media-layer is-active"
                data-menu-image="foto1"
              >
                <Image
                  src="/foto1.jpg"
                  alt="Peluquería canina Maison Vigo en Vigo"
                  fill
                  className="mobile-menu-media-img"
                  sizes="(max-width: 900px) 100vw, 40vw"
                  quality={70}
                  priority
                />
              </div>
              <div className="mobile-menu-media-layer" data-menu-image="foto2">
                <Image
                  src="/assets/images/cuidado-integral.webp"
                  alt="Cuidado integral canino en Maison Vigo, Vigo"
                  fill
                  className="mobile-menu-media-img"
                  sizes="(max-width: 900px) 100vw, 40vw"
                  quality={70}
                  loading="eager"
                />
              </div>
              <div className="mobile-menu-media-layer" data-menu-image="foto3">
                <Image
                  src="/foto3.jpg"
                  alt="Espacio de grooming en Maison Vigo, Vigo"
                  fill
                  className="mobile-menu-media-img"
                  sizes="(max-width: 900px) 100vw, 40vw"
                  quality={70}
                  loading="eager"
                />
              </div>
              <div className="mobile-menu-media-layer" data-menu-image="mvcare">
                <Image
                  src="/assets/images/mvcare-1.webp"
                  alt="MV Care — seguimiento del cuidado canino en Maison Vigo"
                  fill
                  className="mobile-menu-media-img"
                  sizes="(max-width: 900px) 100vw, 40vw"
                  quality={70}
                  loading="eager"
                />
              </div>
            </div>
        </div>

        <button
          type="button"
          className="mobile-menu-close"
          id="closeMenu"
          aria-label="Cerrar menú"
        >
          <svg
            className="icon icon-cross"
            width="30"
            height="30"
            aria-hidden={true}
            viewBox="0 0 30 30"
          >
            <path
              d="M9 9L21 21M21 9L9 21"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <a
          href="/#contacto"
          className="mobile-menu-book mob-link--wave js-open-reserva-panel"
          id="openReservaPanelFromMenu"
          aria-label="Reserva una cita"
        >
          <svg
            className="mobile-menu-book-ring"
            viewBox="0 0 100 100"
            aria-hidden={true}
          >
            <circle
              className="mobile-menu-book-ring-path"
              cx="50"
              cy="50"
              r="49.5"
            />
          </svg>
          <span className="mobile-menu-book-label">
            <ReservaCtaLabel compactOnMobile />
          </span>
        </a>
      </div>

      <div className="reserva-panel" id="reservaPanel" aria-hidden="true">
        <div className="reserva-panel-shell">
          <div className="reserva-panel-body">
            <iframe
              title="Reservar cita Maison Vigo"
              src="about:blank"
              data-booking-src={bookingUrl}
              className="reserva-panel-iframe"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>

        <div className="reserva-panel-media" aria-hidden={true}>
          <div className="reserva-panel-media-frame">
            <div className="reserva-panel-media-layer is-active">
              <Image
                src="/assets/images/cuidado-integral.webp"
                alt="Cuidado integral canino en Maison Vigo, Vigo"
                fill
                className="reserva-panel-media-img"
                sizes="(max-width: 900px) 100vw, 40vw"
                quality={70}
                priority
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          className="reserva-panel-close"
          id="closeReservaPanel"
          aria-label="Cerrar reserva"
        >
          <svg
            className="icon icon-cross"
            width="30"
            height="30"
            aria-hidden={true}
            viewBox="0 0 30 30"
          >
            <path
              d="M9 9L21 21M21 9L9 21"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </>
  );
}
