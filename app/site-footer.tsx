export function SiteFooter() {
  return (
    <footer className="site-footer">
      <section id="contacto" className="site-footer__contacto">
        <div className="contact-block contact-block--brand">
          <img
            src="/logo-anim/anim-1.svg"
            alt="Maison Vigo"
            className="contact-brand-logo"
            width={236}
            height={212}
          />
        </div>
        <div
          className="contact-block contact-block--align-center-r"
        >
          <span className="contact-label">Ubicación</span>
          <div className="contact-info">
            <span className="contact-line">
              <svg
                className="contact-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden={true}
              >
                <path d="M12 21.5s7-7.5 7-12.5a7 7 0 0 0-14 0c0 5 7 12.5 7 12.5z" />
                <circle cx="12" cy="9" r="2.6" />
              </svg>
              <span className="contact-text">
                Rúa das Teixugueiras 29, Portal 5, Bajo.
                <br />
                36212, Vigo
              </span>
            </span>
          </div>
        </div>
        <div
          className="contact-block contact-block--align-center-l"
        >
          <span className="contact-label">Contacto</span>
          <div className="contact-info">
            <a className="contact-line" href="tel:+34986242669">
              <svg
                className="contact-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden={true}
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
              </svg>
              <span className="contact-text">986 24 26 69</span>
            </a>
            <a
              className="contact-line"
              href="https://wa.me/34644577798"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                className="contact-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden={true}
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span className="contact-text">644 577 798</span>
            </a>
            <a className="contact-line" href="mailto:hola@maisonvigo.es">
              <svg
                className="contact-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden={true}
              >
                <rect x="3" y="5" width="18" height="14" rx="1.5" />
                <path d="M3 7l9 6 9-6" />
              </svg>
              <span className="contact-text">hola@maisonvigo.es</span>
            </a>
          </div>
        </div>
        <div
          className="contact-block contact-block--align-end"
        >
          <span className="contact-label">Horario</span>
          <div className="contact-info">
            <span className="contact-line">
              <svg
                className="contact-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden={true}
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <span className="contact-text">
                Lunes — Viernes
                <br />
                10:00 — 18:00 h
              </span>
            </span>
            <span className="contact-line">
              <svg
                className="contact-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden={true}
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <span className="contact-text">
                Sábado
                <br />
                10:00 — 14:00 h
              </span>
            </span>
          </div>
        </div>
      </section>

      <div className="footer-bar">
        <span className="footer-logo">
          {new Date().getFullYear()} © Maison Vigo
        </span>
        <div className="footer-social" aria-label="Redes sociales">
          <a
            className="footer-social-link"
            href="https://instagram.com/maisonvigo"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram de Maison Vigo"
          >
            <svg
              className="footer-social-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden={true}
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.4" cy="6.6" r="0.7" fill="currentColor" />
            </svg>
            <span className="footer-social-handle">@maisonvigo</span>
          </a>
          <a
            className="footer-social-link"
            href="https://facebook.com/maisonvigo"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook de Maison Vigo"
          >
            <svg
              className="footer-social-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden={true}
            >
              <path d="M14.5 8.5h2V5.5h-2.4c-1.7 0-3.1 1.4-3.1 3.1V11H9v3h2v6.5h3V14h2.4l.6-3H14V8.9c0-.22.28-.4.5-.4z" />
            </svg>
            <span className="footer-social-handle">@maisonvigo</span>
          </a>
        </div>
        <ul className="footer-legal" aria-label="Avisos legales">
          <li>
            <a className="footer-legal-link" href="/aviso-legal">
              Aviso legal
            </a>
          </li>
          <li>
            <a className="footer-legal-link" href="/privacidad">
              Política de privacidad
            </a>
          </li>
          <li>
            <a className="footer-legal-link" href="/cookies">
              Cookies
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
