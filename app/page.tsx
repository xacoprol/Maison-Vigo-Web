import Image from "next/image";
import { HomeEffects } from "./home-effects";

const BOOKING_URL = "https://portal.maisonvigo.es/reserva";

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

      <div className="seo-warning" role="status" aria-live="polite">
        Modo no indexado activo (SEO desactivado para buscadores)
      </div>

      <nav id="navbar">
        <div className="nav-start">
          <ul className="nav-links">
            <li>
              <a href="#concepto">Concepto</a>
            </li>
            <li>
              <a href="#servicios">Servicios</a>
            </li>
            <li>
              <a href="#espacio">El Espacio</a>
            </li>
            <li>
              <a href="#contacto">Contacto</a>
            </li>
          </ul>
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
            href={BOOKING_URL}
            className="nav-cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            Reservar
          </a>
          <button
            type="button"
            className="hamburger"
            id="hamburger"
            aria-label="Menú"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <div className="mobile-menu" id="mobileMenu">
        <button type="button" className="close-btn" id="closeMenu">
          ✕
        </button>
        <a href="#concepto" className="mob-link">
          Concepto
        </a>
        <a href="#servicios" className="mob-link">
          Servicios
        </a>
        <a href="#espacio" className="mob-link">
          El Espacio
        </a>
        <a
          href={BOOKING_URL}
          className="mob-link mob-link--booking"
          target="_blank"
          rel="noopener noreferrer"
        >
          Reservar cita
        </a>
        <a href="#contacto" className="mob-link">
          Contacto
        </a>
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
          <h1 className="hero-title">Más que una peluquería canina</h1>
          <p className="hero-sub">
            Un espacio cuidado donde bienestar,
            <br />
            estética y atención van de la mano.
          </p>
          <a
            href="#concepto"
            className="hero-scroll-cta"
            aria-label="Bajar a la sección Concepto"
          >
            <span className="hero-scroll-cta-arrow" aria-hidden={true} />
          </a>
        </div>
      </section>

      <hr className="ornament" />

      <section id="concepto">
        <div className="concepto-visual reveal visible">
          <div className="concepto-visual-frame">
            <Image
              src="/concepto.jpg"
              alt="Maison Vigo — espacio de peluquería canina premium en Vigo."
              fill
              className="concepto-visual-img"
              sizes="(max-width: 900px) 100vw, 42vw"
              quality={88}
            />
          </div>
          <span className="concepto-tag">Maison Vigo — Est. 2024</span>
        </div>

        <div
          className="concepto-text reveal visible"
          style={{ transitionDelay: "0.15s" }}
        >
          <span className="section-label">Concepto</span>
          <h2 className="section-title">
            Esto no es una peluquería canina.
            <br />
            <em>Es cuidado canino premium.</em>
          </h2>
          <p className="section-body">
            Cuidamos cada detalle para que tu perro esté tranquilo, seguro y
            bien atendido.
            <br />
            Sin prisas. Sin ruido. Sin estrés.
            <br />
            Solo atención experta en un espacio pensado para su bienestar.
          </p>

          <div className="concepto-pillars">
            <div className="pillar">
              <span className="pillar-num">01</span>
              <div>
                <p className="pillar-title">Atención individual</p>
                <p className="pillar-text">
                  Un solo animal por turno.
                  <br />
                  Sin jaulas, sin esperas.
                </p>
              </div>
            </div>
            <div className="pillar">
              <span className="pillar-num">02</span>
              <div>
                <p className="pillar-title">Espacio diseñado</p>
                <p className="pillar-text">
                  Un entorno limpio, tranquilo y visible.
                  <br />
                  Cuidado desde dentro y percibido desde fuera.
                </p>
              </div>
            </div>
            <div className="pillar">
              <span className="pillar-num">03</span>
              <div>
                <p className="pillar-title">Productos selectos</p>
                <p className="pillar-text">
                  Cosmética de alta gama.
                  <br />
                  Respeto real por la piel y el pelo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="ornament" />

      <section id="servicios">
        <div className="reveal visible">
          <span className="section-label">Servicios</span>
          <h2 className="section-title">
            Lo que
            <br />
            <em>ofrecemos</em>
          </h2>
          <p className="section-body">
            Cada servicio está diseñado para adaptarse a la raza, el pelaje y
            el carácter de tu animal.
          </p>
        </div>

        <div
          className="services-grid reveal visible"
          style={{ transitionDelay: "0.1s" }}
        >
          <div className="service-card">
            <p className="service-num">01</p>
            <h3 className="service-name">Baño & Secado</h3>
            <p className="service-desc">
              Limpieza profunda con productos específicos para cada tipo de
              pelaje. Secado profesional y cepillado detallado.
            </p>
            <div className="service-includes">
              <span className="service-include">Champú de raza</span>
              <span className="service-include">Acondicionador</span>
              <span className="service-include">Secado artesanal</span>
            </div>
          </div>
          <div className="service-card">
            <p className="service-num">02</p>
            <h3 className="service-name">Corte & Estilismo</h3>
            <p className="service-desc">
              Técnica de tijera y máquina adaptada al estándar de raza o a la
              preferencia del propietario. Resultado limpio y equilibrado.
            </p>
            <div className="service-includes">
              <span className="service-include">Perfilado facial</span>
              <span className="service-include">Acabado de patas</span>
              <span className="service-include">Silueta completa</span>
            </div>
          </div>
          <div className="service-card">
            <p className="service-num">03</p>
            <h3 className="service-name">Tratamientos</h3>
            <p className="service-desc">
              Rituales específicos para pieles sensibles, pelajes dañados o
              necesidades dermatológicas. Cosmética funcional de primer nivel.
            </p>
            <div className="service-includes">
              <span className="service-include">Hidratación profunda</span>
              <span className="service-include">Tratamiento antipiel</span>
              <span className="service-include">Mascarilla de pelo</span>
            </div>
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
