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

import { ACOMPANAMIENTO_INQUIRY_OPEN_EVENT } from "@/lib/care-assist";
import { careApiBaseUrl } from "@/lib/web-store/utils";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

import "./acompanamiento-inquiry-sheet.css";

function inquiryApiUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/acompanamientos/inquiry";
  }
  const base = careApiBaseUrl();
  return base ? `${base}/public/acompanamientos/inquiry` : "";
}

export function AcompanamientoInquirySheet() {
  const titleId = useId();
  const [portalReady, setPortalReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [dogName, setDogName] = useState("");
  const [message, setMessage] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const grabberRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const closeModalRef = useRef<() => void>(() => {});

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const onOpen = () => {
      if (closeTimer.current != null) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      setDone(false);
      setError(null);
      setOpen(true);
    };
    document.body.addEventListener(ACOMPANAMIENTO_INQUIRY_OPEN_EVENT, onOpen);
    return () => {
      document.body.removeEventListener(
        ACOMPANAMIENTO_INQUIRY_OPEN_EVENT,
        onOpen,
      );
    };
  }, []);

  const closeModal = useCallback(() => {
    setVisible(false);
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setMounted(false);
      closeTimer.current = null;
    }, 420);
  }, []);
  closeModalRef.current = closeModal;

  useEffect(() => {
    if (!open) return;
    setMounted(true);
    setVisible(false);
    let frame2 = 0;
    const frame1 = window.requestAnimationFrame(() => {
      frame2 = window.requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      window.cancelAnimationFrame(frame1);
      if (frame2) window.cancelAnimationFrame(frame2);
    };
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    lockScroll();
    return () => unlockScroll();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModalRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const handle = grabberRef.current;
    const panel = panelRef.current;
    if (!handle || !panel) return;
    if (!window.matchMedia("(max-width: 900px)").matches) return;

    type DragState = {
      startY: number;
      lastY: number;
      lastTs: number;
      dy: number;
      velocity: number;
    };
    let drag: DragState | null = null;

    const startDrag = (clientY: number) => {
      drag = {
        startY: clientY,
        lastY: clientY,
        lastTs: performance.now(),
        dy: 0,
        velocity: 0,
      };
      panel.style.transition = "none";
    };
    const moveDrag = (clientY: number) => {
      if (!drag) return;
      const now = performance.now();
      const dt = Math.max(1, now - drag.lastTs);
      drag.velocity = (clientY - drag.lastY) / dt;
      drag.lastY = clientY;
      drag.lastTs = now;
      drag.dy = Math.max(0, clientY - drag.startY);
      panel.style.transform = `translate3d(0, ${drag.dy}px, 0)`;
    };
    const endDrag = () => {
      if (!drag) return;
      const { dy, velocity } = drag;
      drag = null;
      const shouldClose = dy > 100 || (dy > 44 && velocity > 0.35);
      if (shouldClose) {
        panel.style.transition =
          "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)";
        panel.style.transform = "translate3d(0, 108%, 0)";
        window.setTimeout(() => {
          panel.style.transform = "";
          panel.style.transition = "";
          closeModalRef.current();
        }, 420);
        return;
      }
      panel.style.transition =
        "transform 0.36s cubic-bezier(0.22, 1, 0.36, 1)";
      panel.style.transform = "translate3d(0, 0, 0)";
      window.setTimeout(() => {
        panel.style.transform = "";
        panel.style.transition = "";
      }, 380);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      startDrag(event.touches[0]!.clientY);
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!drag || event.touches.length !== 1) return;
      event.preventDefault();
      moveDrag(event.touches[0]!.clientY);
    };
    const onTouchEnd = () => endDrag();

    handle.addEventListener("touchstart", onTouchStart, { passive: true });
    handle.addEventListener("touchmove", onTouchMove, { passive: false });
    handle.addEventListener("touchend", onTouchEnd);
    handle.addEventListener("touchcancel", onTouchEnd);
    return () => {
      handle.removeEventListener("touchstart", onTouchStart);
      handle.removeEventListener("touchmove", onTouchMove);
      handle.removeEventListener("touchend", onTouchEnd);
      handle.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [mounted, visible]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending || done) return;
    setError(null);
    setPending(true);
    try {
      const form = event.currentTarget;
      const website = String(
        new FormData(form).get("website") ?? "",
      ).trim();
      const res = await fetch(inquiryApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website,
          contactName: contactName.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          eventDate,
          venue: venue.trim() || null,
          dogName: dogName.trim() || null,
          message: message.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setError(
          data.message ||
            "No se pudo enviar la solicitud. Prueba de nuevo o WhatsApp.",
        );
        return;
      }
      setDone(true);
    } catch {
      setError(
        "No se pudo conectar. Prueba de nuevo o escríbenos por WhatsApp.",
      );
    } finally {
      setPending(false);
    }
  };

  if (!portalReady || !mounted) return null;

  return createPortal(
    <div
      className={
        "acompanamiento-inquiry-sheet" +
        (visible ? " acompanamiento-inquiry-sheet--visible" : "")
      }
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        ref={panelRef}
        className="acompanamiento-inquiry-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div
          ref={grabberRef}
          className="acompanamiento-inquiry-sheet__grabber"
          aria-hidden={true}
        >
          <span className="acompanamiento-inquiry-sheet__grabber-bar" />
        </div>
        <button
          type="button"
          className="acompanamiento-inquiry-sheet__close"
          aria-label="Cerrar"
          onClick={closeModal}
        >
          ×
        </button>
        <div className="acompanamiento-inquiry-sheet__body">
          <p className="acompanamiento-inquiry-sheet__eyebrow">
            Acompañamiento
          </p>
          <h2 id={titleId} className="acompanamiento-inquiry-sheet__title">
            {done ? "Solicitud enviada" : "Cuéntanos tu evento"}
          </h2>
          {done ? (
            <div className="acompanamiento-inquiry-sheet__success">
              <p>
                Gracias. Hemos recibido tu solicitud y el equipo de Maison Vigo
                se pondrá en contacto contigo.
              </p>
              <button
                type="button"
                className="acompanamiento-inquiry-sheet__submit"
                onClick={closeModal}
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form
              className="acompanamiento-inquiry-sheet__form"
              onSubmit={onSubmit}
              noValidate
            >
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden={true}
                className="acompanamiento-inquiry-sheet__hp"
              />
              <label className="acompanamiento-inquiry-sheet__field">
                <span>Tu nombre</span>
                <input
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label className="acompanamiento-inquiry-sheet__field">
                <span>Teléfono</span>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>
              <label className="acompanamiento-inquiry-sheet__field">
                <span>Email (opcional)</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
              <label className="acompanamiento-inquiry-sheet__field">
                <span>Fecha del evento</span>
                <input
                  required
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </label>
              <label className="acompanamiento-inquiry-sheet__field">
                <span>Lugar (opcional)</span>
                <input
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                />
              </label>
              <label className="acompanamiento-inquiry-sheet__field">
                <span>Nombre del perro (opcional)</span>
                <input
                  value={dogName}
                  onChange={(e) => setDogName(e.target.value)}
                />
              </label>
              <label className="acompanamiento-inquiry-sheet__field">
                <span>Mensaje (opcional)</span>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                />
              </label>
              {error ? (
                <p className="acompanamiento-inquiry-sheet__error" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                className="acompanamiento-inquiry-sheet__submit"
                disabled={pending}
              >
                {pending ? "Enviando…" : "Enviar solicitud"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
