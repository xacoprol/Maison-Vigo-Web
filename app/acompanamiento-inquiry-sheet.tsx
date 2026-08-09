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

import { AcompanamientoDateField } from "./acompanamiento-date-field";

import "./acompanamiento-inquiry-sheet.css";

type EventType = "boda" | "evento_familiar" | "sesion_foto" | "otro";

const EVENT_TYPES: { id: EventType; label: string }[] = [
  { id: "boda", label: "Boda" },
  { id: "evento_familiar", label: "Evento familiar" },
  { id: "sesion_foto", label: "Sesión foto" },
  { id: "otro", label: "Otro" },
];

function inquiryApiUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/acompanamientos/inquiry";
  }
  const base = careApiBaseUrl();
  return base ? `${base}/public/acompanamientos/inquiry` : "";
}

function readLeadSourceFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const origen = new URL(window.location.href).searchParams.get("origen");
  return origen?.trim() || null;
}

function shouldAutoOpenFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  if (!url.pathname.includes("/servicios/acompanamiento")) return false;
  const reserva = url.searchParams.get("reserva");
  return reserva === "1" || reserva === "true" || reserva === "si";
}

function clearReservaQuery() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("reserva") && !url.searchParams.has("origen")) {
    return;
  }
  url.searchParams.delete("reserva");
  /* Conservamos origen en memoria vía state; lo quitamos de la URL limpia. */
  url.searchParams.delete("origen");
  window.history.replaceState(window.history.state, "", url.pathname + url.hash);
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
  const [eventDates, setEventDates] = useState<string[]>([]);
  const [venue, setVenue] = useState("");
  const [dogName, setDogName] = useState("");
  const [dogBreed, setDogBreed] = useState("");
  const [dogAgeYears, setDogAgeYears] = useState("");
  const [eventType, setEventType] = useState<EventType | "">("boda");
  const [needsTransfer, setNeedsTransfer] = useState(false);
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [ringBox, setRingBox] = useState(false);
  const [collarLeash, setCollarLeash] = useState(false);
  const [hoursEstimate, setHoursEstimate] = useState("");
  const [petCareNotes, setPetCareNotes] = useState("");
  const [message, setMessage] = useState("");
  const [leadSource, setLeadSource] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const grabberRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const closeModalRef = useRef<() => void>(() => {});
  const autoOpenedRef = useRef(false);

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
      setLeadSource((prev) => prev ?? readLeadSourceFromUrl());
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

  /** QR / deep-link: ?reserva=1&origen=vigo-bodas */
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (!shouldAutoOpenFromUrl()) return;
    autoOpenedRef.current = true;
    const origen = readLeadSourceFromUrl();
    if (origen) setLeadSource(origen);
    clearReservaQuery();
    const id = window.setTimeout(() => {
      document.body.dispatchEvent(
        new Event(ACOMPANAMIENTO_INQUIRY_OPEN_EVENT),
      );
    }, 700);
    return () => window.clearTimeout(id);
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
      currentY: number;
    };
    let drag: DragState | null = null;

    const onStart = (clientY: number) => {
      drag = { startY: clientY, currentY: clientY };
      panel.style.transition = "none";
    };
    const onMove = (clientY: number) => {
      if (!drag) return;
      drag.currentY = clientY;
      const dy = Math.max(0, clientY - drag.startY);
      panel.style.transform = `translate3d(0, ${dy}px, 0)`;
    };
    const onEnd = () => {
      if (!drag) return;
      const dy = Math.max(0, drag.currentY - drag.startY);
      drag = null;
      panel.style.transition = "";
      panel.style.transform = "";
      if (dy > 110) closeModalRef.current();
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      onStart(e.touches[0]!.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!drag || e.touches.length !== 1) return;
      onMove(e.touches[0]!.clientY);
      if (drag.currentY - drag.startY > 8) e.preventDefault();
    };
    const onTouchEnd = () => onEnd();

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
  }, [mounted]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const name = contactName.trim();
    const tel = phone.trim();
    const mail = email.trim();
    const place = venue.trim();
    const dog = dogName.trim();
    const breed = dogBreed.trim();
    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name) {
      setError("Indica tu nombre");
      return;
    }
    if (!tel) {
      setError("Indica tu teléfono");
      return;
    }
    if (tel.replace(/\D/g, "").length < 7) {
      setError("Indica un teléfono válido");
      return;
    }
    if (mail && !EMAIL_PATTERN.test(mail)) {
      setError("Revisa el formato del email");
      return;
    }
    if (!eventType) {
      setError("Indica el tipo de evento");
      return;
    }
    if (!eventDates.length) {
      setError("Indica al menos una fecha del evento");
      return;
    }
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (eventDates.some((d) => d < todayKey)) {
      setError("La fecha del evento no puede ser anterior a hoy");
      return;
    }
    if (!place) {
      setError("Indica el lugar");
      return;
    }
    if (!dog) {
      setError("Indica el nombre del perro");
      return;
    }
    if (!breed) {
      setError("Indica la raza o el tamaño");
      return;
    }

    const ageRaw = dogAgeYears.trim().replace(",", ".");
    const ageNum = ageRaw === "" ? null : Number(ageRaw);
    if (ageNum != null && (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 30)) {
      setError("Revisa la edad del perro");
      return;
    }

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
          contactName: name,
          phone: tel,
          email: mail || null,
          eventDates: [...eventDates].sort(),
          venue: place,
          dogName: dog,
          dogBreed: breed,
          dogAgeYears: ageNum,
          eventType,
          needsTransfer,
          pickupAddress: needsTransfer
            ? pickupAddress.trim() || null
            : null,
          deliveryAddress: needsTransfer
            ? deliveryAddress.trim() || null
            : null,
          ringBox,
          collarLeash,
          hoursEstimate: hoursEstimate.trim() || null,
          petCareNotes: petCareNotes.trim() || null,
          message: message.trim() || null,
          leadSource: leadSource || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setError(
          data.message ||
            "No se pudo enviar la solicitud. Prueba de nuevo o escríbenos por WhatsApp.",
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
            {done ? "Solicitud enviada" : "Reserva tu día"}
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

              <p className="acompanamiento-inquiry-sheet__section">Contacto</p>
              <div className="acompanamiento-inquiry-sheet__field">
                <input
                  id={`${titleId}-name`}
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  autoComplete="name"
                  placeholder="Tu nombre"
                  aria-label="Tu nombre"
                />
              </div>
              <div className="acompanamiento-inquiry-sheet__row">
                <div className="acompanamiento-inquiry-sheet__field">
                  <input
                    id={`${titleId}-phone`}
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="Teléfono"
                    aria-label="Teléfono"
                  />
                </div>
                <div className="acompanamiento-inquiry-sheet__field">
                  <input
                    id={`${titleId}-email`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="Email"
                    aria-label="Email"
                  />
                </div>
              </div>

              <p className="acompanamiento-inquiry-sheet__section">Evento</p>
              <div
                className="acompanamiento-inquiry-sheet__chips"
                role="group"
                aria-label="Tipo de evento"
              >
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={
                      "acompanamiento-inquiry-sheet__chip" +
                      (eventType === t.id
                        ? " acompanamiento-inquiry-sheet__chip--active"
                        : "")
                    }
                    aria-pressed={eventType === t.id}
                    onClick={() => setEventType(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <AcompanamientoDateField
                id={`${titleId}-date`}
                value={eventDates}
                onChange={setEventDates}
                required
              />
              <div className="acompanamiento-inquiry-sheet__field">
                <input
                  id={`${titleId}-venue`}
                  required
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Lugar / municipio"
                  aria-label="Lugar o municipio"
                />
              </div>
              <div className="acompanamiento-inquiry-sheet__field">
                <input
                  id={`${titleId}-hours`}
                  value={hoursEstimate}
                  onChange={(e) => setHoursEstimate(e.target.value)}
                  placeholder="Horas de presencia (aprox.)"
                  aria-label="Horas de presencia aproximadas"
                />
              </div>

              <p className="acompanamiento-inquiry-sheet__section">Tu perro</p>
              <div className="acompanamiento-inquiry-sheet__field">
                <input
                  id={`${titleId}-dog`}
                  required
                  value={dogName}
                  onChange={(e) => setDogName(e.target.value)}
                  placeholder="Nombre del perro"
                  aria-label="Nombre del perro"
                />
              </div>
              <div className="acompanamiento-inquiry-sheet__row">
                <div className="acompanamiento-inquiry-sheet__field">
                  <input
                    id={`${titleId}-breed`}
                    required
                    value={dogBreed}
                    onChange={(e) => setDogBreed(e.target.value)}
                    placeholder="Raza o tamaño"
                    aria-label="Raza o tamaño"
                  />
                </div>
                <div className="acompanamiento-inquiry-sheet__field">
                  <input
                    id={`${titleId}-age`}
                    inputMode="decimal"
                    value={dogAgeYears}
                    onChange={(e) => setDogAgeYears(e.target.value)}
                    placeholder="Edad (años)"
                    aria-label="Edad en años"
                  />
                </div>
              </div>
              <div className="acompanamiento-inquiry-sheet__field">
                <textarea
                  id={`${titleId}-care`}
                  rows={2}
                  value={petCareNotes}
                  onChange={(e) => setPetCareNotes(e.target.value)}
                  maxLength={2000}
                  placeholder="Carácter, miedos o cuidados (opcional)"
                  aria-label="Notas de cuidado del perro"
                />
              </div>

              <p className="acompanamiento-inquiry-sheet__section">Extras</p>
              <label className="acompanamiento-inquiry-sheet__check">
                <input
                  type="checkbox"
                  checked={needsTransfer}
                  onChange={(e) => setNeedsTransfer(e.target.checked)}
                />
                <span>Necesito recogida / traslado</span>
              </label>
              {needsTransfer ? (
                <>
                  <div className="acompanamiento-inquiry-sheet__field">
                    <input
                      id={`${titleId}-pickup`}
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="Dirección de recogida"
                      aria-label="Dirección de recogida"
                    />
                  </div>
                  <div className="acompanamiento-inquiry-sheet__field">
                    <input
                      id={`${titleId}-delivery`}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Dirección de entrega"
                      aria-label="Dirección de entrega"
                    />
                  </div>
                </>
              ) : null}
              <label className="acompanamiento-inquiry-sheet__check">
                <input
                  type="checkbox"
                  checked={ringBox}
                  onChange={(e) => setRingBox(e.target.checked)}
                />
                <span>Portaalianzas</span>
              </label>
              <label className="acompanamiento-inquiry-sheet__check">
                <input
                  type="checkbox"
                  checked={collarLeash}
                  onChange={(e) => setCollarLeash(e.target.checked)}
                />
                <span>Collar / correa especial</span>
              </label>

              <div className="acompanamiento-inquiry-sheet__field">
                <textarea
                  id={`${titleId}-message`}
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                  placeholder="Cuéntanos más (opcional)"
                  aria-label="Mensaje opcional"
                />
              </div>
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
