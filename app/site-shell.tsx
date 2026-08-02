import Image from "next/image";
import Link from "next/link";

import { bookingUrl } from "@/lib/site-config";

import { CareAssist } from "./care-assist";
import { ReservaCtaLabel } from "./reserva-cta-label";
import { WaveText } from "./wave-text";

/**
 * UI persistente que se monta en el `RootLayout`: navbar, menú móvil,
 * panel de reserva, banner de cookies, FAB de WhatsApp y orientación IA.
 * Los handlers interactivos viven en `<SiteEffects />`.
 */
export function SiteShell() {
  return (
    <>
      <CareAssist />

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

      <a
        href="https://wa.me/34644577798"
        className="whatsapp-fab"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir chat de WhatsApp"
      >
        <svg
          className="whatsapp-fab-icon"
          viewBox="0 0 32 32"
          width="24"
          height="24"
          aria-hidden={true}
        >
          <path
            fill="currentColor"
            d="M16.01 3.2c-7.06 0-12.79 5.72-12.79 12.78 0 2.25.59 4.45 1.7 6.39L3 29l6.83-1.78a12.74 12.74 0 0 0 6.18 1.58h.01c7.05 0 12.78-5.72 12.78-12.78S23.07 3.2 16.01 3.2Zm0 23.44h-.01a10.6 10.6 0 0 1-5.4-1.48l-.38-.23-4.06 1.06 1.08-3.96-.25-.4a10.6 10.6 0 0 1-1.64-5.6c0-5.87 4.78-10.64 10.66-10.64 2.84 0 5.52 1.1 7.53 3.11a10.56 10.56 0 0 1 3.11 7.53c0 5.88-4.78 10.64-10.64 10.64Zm5.83-7.97c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.2.32-.79 1.04-.97 1.25-.18.21-.36.24-.68.08-.32-.16-1.33-.49-2.53-1.56-.93-.83-1.56-1.86-1.75-2.18-.18-.32-.02-.5.14-.66.14-.14.32-.36.47-.54.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.54-.71-.55h-.61c-.21 0-.56.08-.86.4-.29.32-1.12 1.09-1.12 2.66 0 1.57 1.15 3.09 1.31 3.3.16.21 2.26 3.45 5.47 4.83.76.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.89-.77 2.16-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z"
          />
        </svg>
      </a>

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
                  alt=""
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
                  alt=""
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
                  alt=""
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
                  alt=""
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
                alt=""
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
