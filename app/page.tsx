import Image from "next/image";

import { allowIndexing, bookingUrl } from "@/lib/site-config";

import { HomeEffects } from "./home-effects";
import { ServiciosCarousel } from "./servicios-carousel";
import { WaveText } from "./wave-text";

export default function Home() {
  return (
    <>
      <HomeEffects />
      <div className="logo-intro" id="logoIntro" aria-hidden={true}>
        <img
          src="/logo-anim/anim-1.svg"
          alt=""
          width={704}
          height={478}
          className="logo-intro-piece logo-intro-piece--one"
        />
        <img
          src="/logo-anim/anim-2.svg"
          alt=""
          width={704}
          height={478}
          className="logo-intro-piece logo-intro-piece--two"
        />
        <img
          src="/logo-anim/anim-3.svg"
          alt=""
          width={704}
          height={478}
          className="logo-intro-piece logo-intro-piece--three"
        />
      </div>

      {!allowIndexing && (
        <div className="seo-warning" role="status" aria-live="polite">
          Modo no indexado activo (SEO desactivado para buscadores)
        </div>
      )}
      <div className="cookie-banner" id="cookieBanner" role="status" aria-live="polite">
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
        <a
          href="#hero"
          className="nav-brand"
          aria-label="Maison Vigo — inicio"
        >
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
        </a>
        <div className="nav-end">
          <a
            href={bookingUrl}
            className="nav-cta mob-link--wave"
            id="openReservaPanel"
            target="_blank"
            rel="noopener noreferrer"
          >
            <WaveText text="Reserva una cita" />
          </a>
        </div>
      </nav>

      <div className="mobile-menu" id="mobileMenu" aria-hidden="true">
        <div className="mobile-menu-panel">
          <div className="mobile-menu-inner">
            <div className="mobile-menu-primary">
              <a
                href="#concepto"
                className="mob-link mob-link--primary"
                data-menu-image="foto1"
              >
                Concepto
              </a>
              <a
                href="#servicios"
                className="mob-link mob-link--primary"
                data-menu-image="foto2"
              >
                Cuidado integral
              </a>
              <a
                href="#espacio"
                className="mob-link mob-link--primary"
                data-menu-image="foto3"
              >
                El Espacio
              </a>
              <a
                href="#mv-care"
                className="mob-link mob-link--primary"
                data-menu-image="foto3"
              >
                MV CARE
              </a>
            </div>
            <div className="mobile-menu-secondary">
              <a href="#espacio" className="mob-link mob-link--secondary mob-link--wave">
                <WaveText text="Galería" />
              </a>
              <a href="#reserva" className="mob-link mob-link--secondary mob-link--wave">
                <WaveText text="Preguntas" />
              </a>
              <a href="#contacto" className="mob-link mob-link--secondary mob-link--wave">
                <WaveText text="Contactos" />
              </a>
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
          href={bookingUrl}
          className="mobile-menu-book mob-link--wave"
          id="openReservaPanelFromMenu"
          target="_blank"
          rel="noopener noreferrer"
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
            <WaveText text="Reserva una cita" />
          </span>
        </a>

        <div className="mobile-menu-media" aria-hidden={true}>
          <div className="mobile-menu-media-layer is-active" data-menu-image="foto1">
            <Image
              src="/foto1.jpg"
              alt=""
              fill
              className="mobile-menu-media-img"
              sizes="(max-width: 900px) 100vw, 40vw"
              quality={88}
            />
          </div>
          <div className="mobile-menu-media-layer" data-menu-image="foto2">
            <Image
              src="/foto2.jpg"
              alt=""
              fill
              className="mobile-menu-media-img"
              sizes="(max-width: 900px) 100vw, 40vw"
              quality={88}
            />
          </div>
          <div className="mobile-menu-media-layer" data-menu-image="foto3">
            <Image
              src="/foto3.jpg"
              alt=""
              fill
              className="mobile-menu-media-img"
              sizes="(max-width: 900px) 100vw, 40vw"
              quality={88}
            />
          </div>
        </div>
      </div>
      <div className="reserva-panel" id="reservaPanel" aria-hidden="true">
        <div className="reserva-panel-media" aria-hidden={true}>
          <Image
            src="/foto2.jpg"
            alt=""
            fill
            className="reserva-panel-media-img"
            sizes="(max-width: 900px) 100vw, 40vw"
            quality={88}
          />
        </div>
        <div className="reserva-panel-shell">
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
          <div className="reserva-panel-body">
            <iframe
              title="Reservar cita Maison Vigo"
              src={bookingUrl}
              className="reserva-panel-iframe"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="reserva-panel-fallback mob-link--wave"
          >
            <WaveText text="Abrir en nueva pestaña" />
          </a>
        </div>
      </div>

      <section id="hero">
        <div className="hero-media" aria-hidden={true}>
          <video
            id="heroVideo"
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src="/maison-vigo.mp4" type="video/mp4" />
          </video>
          <div className="hero-video-overlay" />
        </div>

        <div className="hero-inner">
          <h1 className="hero-title">
            <span className="hero-title-reveal">Más que una peluquería canina</span>
          </h1>
          <p className="hero-sub">
            <span className="hero-sub-line">Cuidado, calma y estética</span>
            <span className="hero-sub-line">
              en un entorno pensado para su bienestar.
            </span>
          </p>
          <a
            href="#concepto"
            className="hero-scroll-cta"
            aria-label="Bajar a la sección Concepto"
          >
            <span className="hero-scroll-cta-inner">
              <svg
                className="hero-scroll-cta-ring"
                viewBox="0 0 100 100"
                aria-hidden={true}
              >
                <circle
                  className="hero-scroll-cta-ring-path"
                  cx="50"
                  cy="50"
                  r="49.5"
                />
              </svg>
              <span className="hero-scroll-cta-arrow-wrap" aria-hidden={true}>
                <img
                  src="/assets/images/iconos/arrow-down.svg"
                  alt=""
                  width={30}
                  height={30}
                  className="hero-scroll-cta-arrow hero-scroll-cta-arrow--top"
                />
                <img
                  src="/assets/images/iconos/arrow-down.svg"
                  alt=""
                  width={30}
                  height={30}
                  className="hero-scroll-cta-arrow hero-scroll-cta-arrow--bottom"
                />
              </span>
            </span>
          </a>
        </div>
      </section>

      <section id="concepto">
        <div className="concepto-showcase reveal visible" data-parallax-section="concepto">
          <div className="concepto-heading">
            <h2 className="concepto-title-display" data-parallax="title-main" aria-hidden={true}>
              <span className="concepto-title-reveal">
                <img
                  src="/assets/images/detalle.svg"
                  alt=""
                  className="concepto-title-svg"
                  loading="lazy"
                />
              </span>
            </h2>
            <p className="concepto-overline" data-parallax="title-small">
              <span>Cuidado</span>
              <span>Perfeccionado</span>
              <span>con el tiempo</span>
            </p>
          </div>
          <div className="concepto-image-shell concepto-image-shell--bg" data-parallax="media">
            <img
              src="https://grigoriak.doctor/assets/images/media/landing/1.intro/background@xs.webp?v=1776434913"
              alt=""
              className="concepto-image-main concepto-image-main--bg"
              loading="lazy"
            />
          </div>
          <div className="concepto-image-shell concepto-image-shell--top" data-parallax="media">
            <img
              src="/assets/images/caniche.webp"
              alt="Maison Vigo — retrato conceptual."
              className="concepto-image-main concepto-image-main--top"
              loading="lazy"
            />
          </div>

          <p className="concepto-intro-copy" data-parallax="intro-copy">
            Trabajamos cada sesión de forma tranquila y precisa, respetando el
            bienestar, el ritmo y las necesidades de cada perro.
          </p>

          <blockquote className="concepto-quote" data-parallax="quote">
            <img
              src="/assets/images/iconos/quotes.svg"
              alt=""
              width={35}
              height={30}
              className="concepto-quote-mark"
              aria-hidden={true}
            />
            <p>
              Creemos que el verdadero cuidado se percibe en los pequeños
              detalles: el ambiente, el tiempo, la técnica y la atención.
            </p>
            <footer>Maison Vigo</footer>
          </blockquote>

          <a href="#contacto" className="concepto-circle-cta mob-link--wave" data-parallax="cta">
            <svg
              className="concepto-circle-cta-ring"
              viewBox="0 0 100 100"
              aria-hidden={true}
            >
              <circle
                className="concepto-circle-cta-ring-path"
                cx="50"
                cy="50"
                r="49.5"
              />
            </svg>
            <span className="concepto-circle-cta-label">
              <WaveText text="Conócenos" />
            </span>
          </a>
        </div>
      </section>

      <hr className="ornament" />

      <section id="servicios">
        <div className="servicios-parallax-layer servicios-parallax-layer--heading">
          <header className="servicios-heading reveal">
            <h2 className="servicios-heading__title">
              <span className="hero-title-reveal">CUIDADO INTEGRAL</span>
            </h2>
          </header>
        </div>

        <div className="servicios-parallax-layer servicios-parallax-layer--carousel reveal">
          <div className="servicios-carousel-wrap">
            <ServiciosCarousel />
          </div>
        </div>
      </section>

      <hr
        className="ornament"
        style={{ borderColor: "rgba(187,149,93,.1)" }}
      />

      <section id="espacio">
        <div className="espacio-text reveal visible">
          <span className="section-label">El Espacio</span>
          <h2 className="section-title">
            Transparencia
            <br />
            por <em>diseño</em>
          </h2>
          <p className="section-body">
            Una estética que no oculta nada. La zona de trabajo es visible
            desde el exterior a través de cristal. Nada pasa desapercibido.
          </p>
          <p className="section-body" style={{ marginTop: 16 }}>
            El interiorismo fue pensado desde el inicio para transmitir orden,
            limpieza y calma. Materiales nobles, paleta contenida, sin excesos.
          </p>

          <div className="espacio-stats">
            <div>
              <p className="stat-num">01</p>
              <p className="stat-label">Animal por turno</p>
            </div>
            <div>
              <p className="stat-num">100%</p>
              <p className="stat-label">Zona visible</p>
            </div>
            <div>
              <p className="stat-num">∞</p>
              <p className="stat-label">Cuidado</p>
            </div>
          </div>
        </div>

        <div
          className="espacio-visual reveal visible"
          style={{ transitionDelay: "0.2s" }}
        >
          <div className="espacio-panels">
            <div className="espacio-panel espacio-panel--hero">
              <div className="espacio-panel-bg">
                <Image
                  src="/foto1.jpg"
                  alt="Interior Maison Vigo — vista frontal del espacio."
                  fill
                  className="espacio-panel-img"
                  sizes="(max-width: 900px) 100vw, 50vw"
                  quality={88}
                />
              </div>
              <span className="espacio-panel-label">
                Interior — Vista frontal
              </span>
            </div>
            <div className="espacio-panel">
              <div className="espacio-panel-bg">
                <Image
                  src="/foto2.jpg"
                  alt="Zona de trabajo Maison Vigo."
                  fill
                  className="espacio-panel-img"
                  sizes="(max-width: 900px) 100vw, 25vw"
                  quality={88}
                />
              </div>
              <span className="espacio-panel-label">Zona de trabajo</span>
            </div>
            <div className="espacio-panel">
              <div className="espacio-panel-bg">
                <Image
                  src="/foto3.jpg"
                  alt="Zona de espera Maison Vigo."
                  fill
                  className="espacio-panel-img"
                  sizes="(max-width: 900px) 100vw, 25vw"
                  quality={88}
                />
              </div>
              <span className="espacio-panel-label">Zona de espera</span>
            </div>
          </div>
        </div>
      </section>

      <hr className="ornament" />

      <section id="reserva">
        <span className="section-label reveal visible">Reservas</span>
        <h2
          className="section-title reveal visible"
          style={{ transitionDelay: "0.1s" }}
        >
          Reserva tu
          <br />
          <em>cita</em>
        </h2>
        <p
          className="section-body reveal visible"
          style={{ transitionDelay: "0.2s" }}
        >
          Escríbenos con tu nombre y el de tu compañero. Te contactaremos para
          confirmar fecha y hora.
        </p>

        <div
          className="reserva-form reveal visible"
          style={{ transitionDelay: "0.3s" }}
        >
          <input
            className="reserva-input"
            type="tel"
            placeholder="+34 600 000 000"
            name="phone"
            autoComplete="tel"
          />
          <button type="button" className="reserva-btn">
            Contactar
          </button>
        </div>
        <p
          className="reserva-note reveal visible"
          style={{ transitionDelay: "0.4s" }}
        >
          También por WhatsApp o llamada directa
        </p>

        <div
          className="reserva-options reveal visible"
          style={{ transitionDelay: "0.5s" }}
        >
          <div className="reserva-option">
            <p className="reserva-option-icon">Teléfono</p>
            <h3 className="reserva-option-title">Llamada</h3>
            <p className="reserva-option-desc">
              Lunes a sábado
              <br />
              9:30 — 19:00 h
            </p>
          </div>
          <div className="reserva-option">
            <p className="reserva-option-icon">Mensaje</p>
            <h3 className="reserva-option-title">WhatsApp</h3>
            <p className="reserva-option-desc">
              Respuesta en menos
              <br />
              de 2 horas
            </p>
          </div>
          <div className="reserva-option">
            <p className="reserva-option-icon">Online</p>
            <h3 className="reserva-option-title">Próximamente</h3>
            <p className="reserva-option-desc">
              Sistema de reservas
              <br />
              online en desarrollo
            </p>
          </div>
        </div>
      </section>

      <hr
        className="ornament"
        style={{ borderColor: "rgba(187,149,93,.1)" }}
      />

      <section id="contacto">
        <div className="contact-block reveal visible">
          <span className="contact-label">Ubicación</span>
          <p>
            Vigo, Galicia
            <br />
            Dirección disponible
            <br />
            al confirmar cita
          </p>
        </div>
        <div
          className="contact-block reveal visible"
          style={{ transitionDelay: "0.1s" }}
        >
          <span className="contact-label">Contacto</span>
          <p>
            <a href="tel:+34600000000">+34 600 000 000</a>
            <br />
            <a href="mailto:hola@maisonvigo.es">hola@maisonvigo.es</a>
          </p>
        </div>
        <div
          className="contact-block reveal visible"
          style={{ transitionDelay: "0.2s" }}
        >
          <span className="contact-label">Horario</span>
          <p>
            Lunes — Viernes
            <br />
            9:30 — 19:00 h
            <br />
            <br />
            Sábado
            <br />
            10:00 — 14:00 h
          </p>
        </div>
      </section>

      <footer>
        <span className="footer-logo">
          Maison Vigo — Peluquería Canina
        </span>
        <span className="footer-copy">
          © 2024 Maison Vigo. Todos los derechos reservados.
        </span>
      </footer>
    </>
  );
}
