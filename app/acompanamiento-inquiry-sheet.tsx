"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { ACOMPANAMIENTO_INQUIRY_OPEN_EVENT } from "@/lib/care-assist";
import { careApiBaseUrl } from "@/lib/web-store/utils";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

import { AcompanamientoDateField } from "./acompanamiento-date-field";

import "./acompanamiento-inquiry-sheet.css";

type EventType = "boda" | "evento_familiar" | "otro";

const EVENT_TYPES: { id: EventType; label: string }[] = [
  { id: "boda", label: "Boda" },
  { id: "evento_familiar", label: "Evento familiar" },
  { id: "otro", label: "Otro" },
];

const STEPS = [
  { key: "contacto", label: "Contacto" },
  { key: "evento", label: "Evento" },
  { key: "perro", label: "Tu perro" },
  { key: "extras", label: "Extras" },
] as const;

type StepIndex = 0 | 1 | 2 | 3;

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

type FloatFieldProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
};

function InquiryFloatField({ id, label, error, children }: FloatFieldProps) {
  return (
    <div
      className={
        "acompanamiento-inquiry-sheet__field acompanamiento-inquiry-sheet__field--float" +
        (error ? " acompanamiento-inquiry-sheet__field--error" : "")
      }
    >
      {children}
      <label htmlFor={id}>{label}</label>
      {error ? (
        <p
          id={`${id}-error`}
          className="acompanamiento-inquiry-sheet__field-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<StepIndex>(0);
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventDates, setEventDates] = useState<string[]>([]);
  const [venue, setVenue] = useState("");
  const [dogName, setDogName] = useState("");
  const [dogBreed, setDogBreed] = useState("");
  const [dogAgeYears, setDogAgeYears] = useState("");
  const [dogSterilized, setDogSterilized] = useState<boolean | null>(null);
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
      setFieldErrors({});
      setStep(0);
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

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const focusFirstError = useCallback(
    (nextErrors: Record<string, string>) => {
      const focusOrder = [
        "name",
        "phone",
        "email",
        "eventType",
        "dates",
        "venue",
        "dog",
        "breed",
        "age",
      ] as const;
      const firstKey = focusOrder.find((k) => nextErrors[k]);
      const focusId =
        firstKey === "eventType"
          ? null
          : firstKey === "dates"
            ? `${titleId}-date`
            : firstKey
              ? `${titleId}-${firstKey}`
              : null;
      window.requestAnimationFrame(() => {
        const body = panelRef.current?.querySelector(
          ".acompanamiento-inquiry-sheet__body",
        );
        body?.scrollTo({ top: 0, behavior: "smooth" });
        if (focusId) {
          document.getElementById(focusId)?.focus({ preventScroll: true });
        } else if (firstKey === "eventType") {
          document
            .getElementById(`${titleId}-event-type`)
            ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      });
    },
    [titleId],
  );

  const collectErrors = useCallback(
    (forStep?: StepIndex): Record<string, string> => {
      const name = contactName.trim();
      const tel = phone.trim();
      const mail = email.trim();
      const place = venue.trim();
      const dog = dogName.trim();
      const breed = dogBreed.trim();
      const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const nextErrors: Record<string, string> = {};

      const checkContact = forStep == null || forStep === 0;
      const checkEvent = forStep == null || forStep === 1;
      const checkDog = forStep == null || forStep === 2;

      if (checkContact) {
        if (!name) nextErrors.name = "Indica tu nombre";
        if (!tel) nextErrors.phone = "Indica tu teléfono";
        else if (tel.replace(/\D/g, "").length < 7) {
          nextErrors.phone = "Indica un teléfono válido";
        }
        if (mail && !EMAIL_PATTERN.test(mail)) {
          nextErrors.email = "Revisa el formato del email";
        }
      }

      if (checkEvent) {
        if (!eventType) nextErrors.eventType = "Indica el tipo de evento";
        if (!eventDates.length) {
          nextErrors.dates = "Indica al menos una fecha del evento";
        } else {
          const today = new Date();
          const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          if (eventDates.some((d) => d < todayKey)) {
            nextErrors.dates =
              "La fecha del evento no puede ser anterior a hoy";
          }
        }
        if (!place) nextErrors.venue = "Indica el lugar";
      }

      if (checkDog) {
        if (!dog) nextErrors.dog = "Indica el nombre del perro";
        if (!breed) nextErrors.breed = "Indica la raza o el tamaño";
        const ageRaw = dogAgeYears.trim().replace(",", ".");
        const ageNum = ageRaw === "" ? null : Number(ageRaw);
        if (
          ageNum != null &&
          (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 30)
        ) {
          nextErrors.age = "Revisa la edad del perro";
        }
      }

      return nextErrors;
    },
    [
      contactName,
      phone,
      email,
      eventType,
      eventDates,
      venue,
      dogName,
      dogBreed,
      dogAgeYears,
    ],
  );

  const goNext = () => {
    setError(null);
    const nextErrors = collectErrors(step);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return;
    }
    setFieldErrors({});
    setStep((s) => Math.min(3, s + 1) as StepIndex);
    panelRef.current
      ?.querySelector(".acompanamiento-inquiry-sheet__body")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setError(null);
    setFieldErrors({});
    setStep((s) => Math.max(0, s - 1) as StepIndex);
    panelRef.current
      ?.querySelector(".acompanamiento-inquiry-sheet__body")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (step < 3) {
      goNext();
      return;
    }

    const nextErrors = collectErrors();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const stepForKey = (key: string): StepIndex => {
        if (key === "name" || key === "phone" || key === "email") return 0;
        if (
          key === "eventType" ||
          key === "dates" ||
          key === "venue"
        ) {
          return 1;
        }
        return 2;
      };
      const firstKey = Object.keys(nextErrors)[0]!;
      setStep(stepForKey(firstKey));
      focusFirstError(nextErrors);
      return;
    }

    const name = contactName.trim();
    const tel = phone.trim();
    const mail = email.trim();
    const place = venue.trim();
    const dog = dogName.trim();
    const breed = dogBreed.trim();
    const ageRaw = dogAgeYears.trim().replace(",", ".");
    const ageNum = ageRaw === "" ? null : Number(ageRaw);

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
          dogSterilized,
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
            {done ? "Solicitud enviada" : "Pide tu propuesta"}
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

              <div
                className="acompanamiento-inquiry-sheet__progress"
                aria-label={`Paso ${step + 1} de ${STEPS.length}`}
              >
                <p className="acompanamiento-inquiry-sheet__progress-index">
                  {String(step + 1).padStart(2, "0")} —{" "}
                  {String(STEPS.length).padStart(2, "0")}
                </p>
                <ol className="acompanamiento-inquiry-sheet__progress-dots">
                  {STEPS.map((s, i) => (
                    <li
                      key={s.key}
                      className={
                        "acompanamiento-inquiry-sheet__progress-dot" +
                        (i === step ? " is-current" : "") +
                        (i < step ? " is-done" : "")
                      }
                      aria-label={s.label}
                      aria-current={i === step ? "step" : undefined}
                    />
                  ))}
                </ol>
              </div>

              <p className="acompanamiento-inquiry-sheet__section">
                {STEPS[step].label}
              </p>

              {step === 0 ? (
                <>
                  <InquiryFloatField
                    id={`${titleId}-name`}
                    label="Tu nombre"
                    error={fieldErrors.name}
                  >
                    <input
                      id={`${titleId}-name`}
                      value={contactName}
                      onChange={(e) => {
                        setContactName(e.target.value);
                        clearFieldError("name");
                      }}
                      autoComplete="name"
                      placeholder="Tu nombre"
                      aria-invalid={fieldErrors.name ? true : undefined}
                      aria-describedby={
                        fieldErrors.name ? `${titleId}-name-error` : undefined
                      }
                    />
                  </InquiryFloatField>
                  <InquiryFloatField
                    id={`${titleId}-phone`}
                    label="Teléfono"
                    error={fieldErrors.phone}
                  >
                    <input
                      id={`${titleId}-phone`}
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        clearFieldError("phone");
                      }}
                      autoComplete="tel"
                      placeholder="Teléfono"
                      aria-invalid={fieldErrors.phone ? true : undefined}
                      aria-describedby={
                        fieldErrors.phone
                          ? `${titleId}-phone-error`
                          : undefined
                      }
                    />
                  </InquiryFloatField>
                  <InquiryFloatField
                    id={`${titleId}-email`}
                    label="Email"
                    error={fieldErrors.email}
                  >
                    <input
                      id={`${titleId}-email`}
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError("email");
                      }}
                      autoComplete="email"
                      placeholder="Email"
                      aria-invalid={fieldErrors.email ? true : undefined}
                      aria-describedby={
                        fieldErrors.email
                          ? `${titleId}-email-error`
                          : undefined
                      }
                    />
                  </InquiryFloatField>
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <div
                    id={`${titleId}-event-type`}
                    className={
                      "acompanamiento-inquiry-sheet__chips" +
                      (fieldErrors.eventType
                        ? " acompanamiento-inquiry-sheet__chips--error"
                        : "")
                    }
                    role="group"
                    aria-label="Tipo de evento"
                    aria-invalid={fieldErrors.eventType ? true : undefined}
                    aria-describedby={
                      fieldErrors.eventType
                        ? `${titleId}-eventType-error`
                        : undefined
                    }
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
                        onClick={() => {
                          setEventType(t.id);
                          clearFieldError("eventType");
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.eventType ? (
                    <p
                      id={`${titleId}-eventType-error`}
                      className="acompanamiento-inquiry-sheet__field-error"
                      role="alert"
                    >
                      {fieldErrors.eventType}
                    </p>
                  ) : null}
                  <AcompanamientoDateField
                    id={`${titleId}-date`}
                    value={eventDates}
                    onChange={(next) => {
                      setEventDates(next);
                      clearFieldError("dates");
                    }}
                    error={fieldErrors.dates ?? null}
                  />
                  <InquiryFloatField
                    id={`${titleId}-venue`}
                    label="Lugar / municipio"
                    error={fieldErrors.venue}
                  >
                    <input
                      id={`${titleId}-venue`}
                      value={venue}
                      onChange={(e) => {
                        setVenue(e.target.value);
                        clearFieldError("venue");
                      }}
                      placeholder="Lugar / municipio"
                      aria-invalid={fieldErrors.venue ? true : undefined}
                      aria-describedby={
                        fieldErrors.venue
                          ? `${titleId}-venue-error`
                          : undefined
                      }
                    />
                  </InquiryFloatField>
                  <InquiryFloatField
                    id={`${titleId}-hours`}
                    label="Horas de presencia (aprox.)"
                  >
                    <input
                      id={`${titleId}-hours`}
                      value={hoursEstimate}
                      onChange={(e) => setHoursEstimate(e.target.value)}
                      placeholder="Horas de presencia (aprox.)"
                    />
                  </InquiryFloatField>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <InquiryFloatField
                    id={`${titleId}-dog`}
                    label="Nombre del perro"
                    error={fieldErrors.dog}
                  >
                    <input
                      id={`${titleId}-dog`}
                      value={dogName}
                      onChange={(e) => {
                        setDogName(e.target.value);
                        clearFieldError("dog");
                      }}
                      placeholder="Nombre del perro"
                      aria-invalid={fieldErrors.dog ? true : undefined}
                      aria-describedby={
                        fieldErrors.dog ? `${titleId}-dog-error` : undefined
                      }
                    />
                  </InquiryFloatField>
                  <div className="acompanamiento-inquiry-sheet__row">
                    <InquiryFloatField
                      id={`${titleId}-breed`}
                      label="Raza o tamaño"
                      error={fieldErrors.breed}
                    >
                      <input
                        id={`${titleId}-breed`}
                        value={dogBreed}
                        onChange={(e) => {
                          setDogBreed(e.target.value);
                          clearFieldError("breed");
                        }}
                        placeholder="Raza o tamaño"
                        aria-invalid={fieldErrors.breed ? true : undefined}
                        aria-describedby={
                          fieldErrors.breed
                            ? `${titleId}-breed-error`
                            : undefined
                        }
                      />
                    </InquiryFloatField>
                    <InquiryFloatField
                      id={`${titleId}-age`}
                      label="Edad (años)"
                      error={fieldErrors.age}
                    >
                      <input
                        id={`${titleId}-age`}
                        inputMode="decimal"
                        value={dogAgeYears}
                        onChange={(e) => {
                          setDogAgeYears(e.target.value);
                          clearFieldError("age");
                        }}
                        placeholder="Edad (años)"
                        aria-invalid={fieldErrors.age ? true : undefined}
                        aria-describedby={
                          fieldErrors.age
                            ? `${titleId}-age-error`
                            : undefined
                        }
                      />
                    </InquiryFloatField>
                  </div>
                  <div
                    className="acompanamiento-inquiry-sheet__choice"
                    role="group"
                    aria-label="Esterilizado"
                  >
                    <p className="acompanamiento-inquiry-sheet__choice-label">
                      Esterilizado
                    </p>
                    <div className="acompanamiento-inquiry-sheet__chips">
                      {(
                        [
                          { value: true, label: "Sí" },
                          { value: false, label: "No" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          className={
                            "acompanamiento-inquiry-sheet__chip" +
                            (dogSterilized === opt.value
                              ? " acompanamiento-inquiry-sheet__chip--active"
                              : "")
                          }
                          aria-pressed={dogSterilized === opt.value}
                          onClick={() =>
                            setDogSterilized((prev) =>
                              prev === opt.value ? null : opt.value,
                            )
                          }
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <InquiryFloatField
                    id={`${titleId}-care`}
                    label="Carácter, miedos o cuidados (opcional)"
                  >
                    <textarea
                      id={`${titleId}-care`}
                      rows={3}
                      value={petCareNotes}
                      onChange={(e) => setPetCareNotes(e.target.value)}
                      maxLength={2000}
                      placeholder="Carácter, miedos o cuidados (opcional)"
                    />
                  </InquiryFloatField>
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <div className="acompanamiento-inquiry-sheet__extras">
                    <label className="acompanamiento-inquiry-sheet__check">
                      <input
                        type="checkbox"
                        checked={needsTransfer}
                        onChange={(e) => setNeedsTransfer(e.target.checked)}
                      />
                      <span className="acompanamiento-inquiry-sheet__check-text">
                        Necesito recogida / traslado
                        <button
                          type="button"
                          className="acompanamiento-inquiry-sheet__tip"
                          aria-label="Más información sobre recogida y traslado"
                          aria-describedby={`${titleId}-tip-transfer`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.currentTarget.focus();
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <span aria-hidden={true}>?</span>
                          <span
                            id={`${titleId}-tip-transfer`}
                            role="tooltip"
                            className="acompanamiento-inquiry-sheet__tip-bubble"
                          >
                            Recogemos a tu perro y lo llevamos al evento (y de
                            vuelta, si lo necesitáis).
                          </span>
                        </button>
                      </span>
                    </label>
                    {needsTransfer ? (
                      <>
                        <InquiryFloatField
                          id={`${titleId}-pickup`}
                          label="Dirección de recogida"
                        >
                          <input
                            id={`${titleId}-pickup`}
                            value={pickupAddress}
                            onChange={(e) => setPickupAddress(e.target.value)}
                            placeholder="Dirección de recogida"
                          />
                        </InquiryFloatField>
                        <InquiryFloatField
                          id={`${titleId}-delivery`}
                          label="Dirección de entrega"
                        >
                          <input
                            id={`${titleId}-delivery`}
                            value={deliveryAddress}
                            onChange={(e) =>
                              setDeliveryAddress(e.target.value)
                            }
                            placeholder="Dirección de entrega"
                          />
                        </InquiryFloatField>
                      </>
                    ) : null}
                    <label className="acompanamiento-inquiry-sheet__check">
                      <input
                        type="checkbox"
                        checked={ringBox}
                        onChange={(e) => setRingBox(e.target.checked)}
                      />
                      <span className="acompanamiento-inquiry-sheet__check-text">
                        Portaalianzas
                        <button
                          type="button"
                          className="acompanamiento-inquiry-sheet__tip"
                          aria-label="Más información sobre el portaalianzas"
                          aria-describedby={`${titleId}-tip-ring`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.currentTarget.focus();
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <span aria-hidden={true}>?</span>
                          <span
                            id={`${titleId}-tip-ring`}
                            role="tooltip"
                            className="acompanamiento-inquiry-sheet__tip-bubble"
                          >
                            Lo lleva el perrito. Irá grabado con las iniciales
                            de la pareja, el nombre del perro y la fecha del
                            evento.
                          </span>
                        </button>
                      </span>
                    </label>
                    <label className="acompanamiento-inquiry-sheet__check">
                      <input
                        type="checkbox"
                        checked={collarLeash}
                        onChange={(e) => setCollarLeash(e.target.checked)}
                      />
                      <span className="acompanamiento-inquiry-sheet__check-text">
                        Collar / correa especial
                        <button
                          type="button"
                          className="acompanamiento-inquiry-sheet__tip"
                          aria-label="Más información sobre collar y correa"
                          aria-describedby={`${titleId}-tip-collar`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.currentTarget.focus();
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <span aria-hidden={true}>?</span>
                          <span
                            id={`${titleId}-tip-collar`}
                            role="tooltip"
                            className="acompanamiento-inquiry-sheet__tip-bubble"
                          >
                            Disponible en diferentes colores. Hecho en biotane.
                          </span>
                        </button>
                      </span>
                    </label>
                  </div>

                  <InquiryFloatField
                    id={`${titleId}-message`}
                    label="Cuéntanos más (opcional)"
                  >
                    <textarea
                      id={`${titleId}-message`}
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={2000}
                      placeholder="Cuéntanos más (opcional)"
                    />
                  </InquiryFloatField>
                </>
              ) : null}

              {Object.keys(fieldErrors).length > 0 ? (
                <p
                  className="acompanamiento-inquiry-sheet__notice"
                  role="alert"
                >
                  Revisa los campos marcados.
                </p>
              ) : null}
              {error ? (
                <p className="acompanamiento-inquiry-sheet__error" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="acompanamiento-inquiry-sheet__nav">
                {step > 0 ? (
                  <button
                    type="button"
                    className="acompanamiento-inquiry-sheet__nav-back"
                    onClick={goBack}
                  >
                    Atrás
                  </button>
                ) : (
                  <span />
                )}
                {step < 3 ? (
                  <button
                    type="submit"
                    className="acompanamiento-inquiry-sheet__submit"
                  >
                    Continuar
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="acompanamiento-inquiry-sheet__submit"
                    disabled={pending}
                  >
                    {pending ? "Enviando…" : "Enviar solicitud"}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
