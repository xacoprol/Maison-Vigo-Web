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
import {
  AcompanamientoInquiryBreedField,
  titleCaseBreedLabel,
} from "./acompanamiento-inquiry-breed-field";
import {
  AcompanamientoInquiryJewelry,
  validateInquiryJewelryItems,
  type InquiryJewelryItem,
} from "./acompanamiento-inquiry-jewelry";

import "./acompanamiento-inquiry-sheet.css";

type EventType = "boda" | "evento_familiar" | "otro";
type DogSex = "male" | "female";
type RingBoxColor = "white" | "brown";

const EVENT_TYPES: { id: EventType; label: string }[] = [
  { id: "boda", label: "Boda" },
  { id: "evento_familiar", label: "Evento familiar" },
  { id: "otro", label: "Otro" },
];

const DOG_SEX_OPTIONS: { id: DogSex; label: string }[] = [
  { id: "male", label: "Macho" },
  { id: "female", label: "Hembra" },
];

const RING_COLOR_OPTIONS: { id: RingBoxColor; label: string }[] = [
  { id: "white", label: "Blanco" },
  { id: "brown", label: "Marrón" },
];

const STEPS = [
  { key: "contacto", label: "Contacto" },
  { key: "evento", label: "Evento" },
  { key: "perro", label: "Mascotas" },
  { key: "extras", label: "Extras" },
] as const;

type StepIndex = 0 | 1 | 2 | 3;

const MAX_INQUIRY_DOGS = 5;

type InquiryDogDraft = {
  name: string;
  breed: string;
  ageYears: string;
  sex: DogSex | null;
  sterilized: boolean | null;
};

type InquiryDogSummary = {
  name: string;
  breed: string;
  ageYears: number | null;
  sex: DogSex | null;
  sterilized: boolean | null;
};

function emptyDogDraft(): InquiryDogDraft {
  return { name: "", breed: "", ageYears: "", sex: null, sterilized: null };
}

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

const INQUIRY_SENT_COOKIE = "mv_acomp_inquiry_sent";
const INQUIRY_SUMMARY_KEY = "mv_acomp_inquiry_summary";
/** 90 días: evita reenvíos accidentales al reabrir el sheet. */
const INQUIRY_SENT_MAX_AGE_SEC = 60 * 60 * 24 * 90;

type InquirySummary = {
  contactName: string;
  phone: string;
  email: string | null;
  eventType: EventType | "";
  eventDates: string[];
  venue: string;
  dogs: InquiryDogSummary[];
  /** Compat resúmenes antiguos (un solo perro). */
  dogName?: string;
  dogBreed?: string;
  dogAgeYears?: number | null;
  dogSex?: DogSex | null;
  dogSterilized?: boolean | null;
  needsTransfer: boolean;
  pickupAddress: string | null;
  deliveryAddress: string | null;
  ringBox: boolean;
  ringBoxColor: RingBoxColor | null;
  collarLeash: boolean;
  jewelryItems: InquiryJewelryItem[];
  hoursEstimate: string | null;
  petCareNotes: string | null;
  message: string | null;
};

function dogsFromSummary(summary: InquirySummary): InquiryDogSummary[] {
  if (Array.isArray(summary.dogs) && summary.dogs.length) {
    return summary.dogs
      .map((d) => ({
        name: String(d?.name ?? "").trim(),
        breed: String(d?.breed ?? "").trim(),
        ageYears:
          d?.ageYears == null || Number.isNaN(Number(d.ageYears))
            ? null
            : Number(d.ageYears),
        sex: d?.sex === "male" || d?.sex === "female" ? d.sex : null,
        sterilized:
          d?.sterilized === true ? true : d?.sterilized === false ? false : null,
      }))
      .filter((d) => d.name);
  }
  const legacyName = String(summary.dogName ?? "").trim();
  if (!legacyName) return [];
  return [
    {
      name: legacyName,
      breed: String(summary.dogBreed ?? "").trim(),
      ageYears: summary.dogAgeYears ?? null,
      sex: summary.dogSex === "male" || summary.dogSex === "female" ? summary.dogSex : null,
      sterilized:
        summary.dogSterilized === true
          ? true
          : summary.dogSterilized === false
            ? false
            : null,
    },
  ];
}

function readInquirySentCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part === `${INQUIRY_SENT_COOKIE}=1`);
}

function markInquirySentCookie() {
  document.cookie = `${INQUIRY_SENT_COOKIE}=1; Max-Age=${INQUIRY_SENT_MAX_AGE_SEC}; Path=/; SameSite=Lax`;
}

function clearInquirySentCookie() {
  document.cookie = `${INQUIRY_SENT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function saveInquirySummary(summary: InquirySummary) {
  try {
    window.localStorage.setItem(INQUIRY_SUMMARY_KEY, JSON.stringify(summary));
  } catch {
    /* ignore quota / private mode */
  }
}

function readInquirySummary(): InquirySummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(INQUIRY_SUMMARY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InquirySummary;
    if (!parsed || typeof parsed.contactName !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearInquirySummary() {
  try {
    window.localStorage.removeItem(INQUIRY_SUMMARY_KEY);
  } catch {
    /* ignore */
  }
}

function formatSummaryDate(key: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return key;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(y, mo - 1, d));
}

function eventTypeLabel(id: EventType | ""): string {
  if (!id) return "—";
  return EVENT_TYPES.find((t) => t.id === id)?.label ?? id;
}

function summaryRows(summary: InquirySummary): { label: string; value: string }[] {
  const extras = [
    summary.needsTransfer ? "Traslado" : null,
    summary.ringBox
      ? summary.ringBoxColor === "white"
        ? "Portaalianzas (blanco)"
        : summary.ringBoxColor === "brown"
          ? "Portaalianzas (marrón)"
          : "Portaalianzas"
      : null,
    summary.collarLeash ? "Collar / Biothane" : null,
    ...(summary.jewelryItems?.length
      ? summary.jewelryItems.map((j) => `Joya: ${j.name}${j.optionLabel ? ` (${j.optionLabel})` : ""}`)
      : []),
  ].filter(Boolean) as string[];

  const rows: { label: string; value: string }[] = [
    { label: "Contacto", value: summary.contactName },
    { label: "Teléfono", value: summary.phone },
  ];
  if (summary.email) rows.push({ label: "Email", value: summary.email });
  rows.push(
    { label: "Evento", value: eventTypeLabel(summary.eventType) },
    {
      label: summary.eventDates.length > 1 ? "Fechas" : "Fecha",
      value: summary.eventDates.length
        ? summary.eventDates.map(formatSummaryDate).join(" · ")
        : "—",
    },
    { label: "Lugar", value: summary.venue },
  );
  const dogs = dogsFromSummary(summary);
  dogs.forEach((dog, idx) => {
    const prefix = dogs.length > 1 ? `Perro ${idx + 1}` : "Perro";
    rows.push({ label: prefix, value: dog.name });
    if (dog.breed) rows.push({ label: `${prefix} · raza`, value: dog.breed });
    if (dog.ageYears != null) {
      rows.push({ label: `${prefix} · edad`, value: `${dog.ageYears} años` });
    }
    if (dog.sex) {
      rows.push({
        label: `${prefix} · sexo`,
        value: dog.sex === "male" ? "Macho" : "Hembra",
      });
    }
    if (dog.sterilized != null) {
      rows.push({
        label: `${prefix} · esterilizado`,
        value: dog.sterilized ? "Sí" : "No",
      });
    }
  });
  if (summary.hoursEstimate) {
    rows.push({ label: "Horas", value: summary.hoursEstimate });
  }
  if (extras.length) {
    rows.push({ label: "Extras", value: extras.join(" · ") });
  }
  if (summary.needsTransfer && summary.pickupAddress) {
    rows.push({ label: "Recogida", value: summary.pickupAddress });
  }
  if (summary.needsTransfer && summary.deliveryAddress) {
    rows.push({ label: "Entrega", value: summary.deliveryAddress });
  }
  if (summary.petCareNotes) {
    rows.push({ label: "Cuidados", value: summary.petCareNotes });
  }
  if (summary.message) {
    rows.push({ label: "Mensaje", value: summary.message });
  }
  return rows;
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

function InquirySuccessHeart() {
  const uid = useId().replace(/:/g, "");
  const fillId = `acomp-inquiry-heart-fill-${uid}`;
  const sheenId = `acomp-inquiry-heart-sheen-${uid}`;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={true}
      className="acompanamiento-inquiry-sheet__success-heart"
    >
      <defs>
        <linearGradient
          id={fillId}
          x1="4"
          y1="3"
          x2="18"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#f0d78a" />
          <stop offset="55%" stopColor="#e0b85a" />
          <stop offset="100%" stopColor="#bb955d" />
        </linearGradient>
        <linearGradient
          id={sheenId}
          x1="8"
          y1="5"
          x2="14"
          y2="14"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#fff8e8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fff8e8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M12 20.35c-.35 0-.7-.1-1-.3C7.4 17.55 3.5 14.15 3.5 10.1A4.55 4.55 0 0 1 8.05 5.5c1.35 0 2.6.55 3.45 1.5A4.55 4.55 0 0 1 15.95 5.5 4.55 4.55 0 0 1 20.5 10.1c0 4.05-3.9 7.45-7.5 9.95-.3.2-.65.3-1 .3Z"
        fill={`url(#${fillId})`}
      />
      <path
        d="M12 7.85c.55-.7 1.45-1.45 2.7-1.55 1.55-.1 2.85.9 3.15 2.25.15.7.05 1.4-.25 2.05"
        stroke={`url(#${sheenId})`}
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
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
  /** Reabrimos con cookie: mensaje “ya enviada” + CTA para otra. */
  const [alreadySent, setAlreadySent] = useState(false);
  const [summary, setSummary] = useState<InquirySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<StepIndex>(0);
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventDates, setEventDates] = useState<string[]>([]);
  const [venue, setVenue] = useState("");
  const [dogs, setDogs] = useState<InquiryDogDraft[]>(() => [emptyDogDraft()]);
  const [breedOptions, setBreedOptions] = useState<string[]>(["Mestizo"]);
  const [eventType, setEventType] = useState<EventType | "">("boda");
  const [needsTransfer, setNeedsTransfer] = useState(false);
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [ringBox, setRingBox] = useState(false);
  const [ringBoxColor, setRingBoxColor] = useState<RingBoxColor | null>(null);
  const [collarLeash, setCollarLeash] = useState(false);
  const [jewelryItems, setJewelryItems] = useState<InquiryJewelryItem[]>([]);
  const [hoursEstimate, setHoursEstimate] = useState("");
  const [petCareNotes, setPetCareNotes] = useState("");
  const [message, setMessage] = useState("");
  const [leadSource, setLeadSource] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const grabberRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const closeModalRef = useRef<() => void>(() => {});
  const autoOpenedRef = useRef(false);

  const resetFormFields = useCallback(() => {
    setContactName("");
    setPhone("");
    setEmail("");
    setEventDates([]);
    setVenue("");
    setDogs([emptyDogDraft()]);
    setEventType("boda");
    setNeedsTransfer(false);
    setPickupAddress("");
    setDeliveryAddress("");
    setRingBox(false);
    setRingBoxColor(null);
    setCollarLeash(false);
    setJewelryItems([]);
    setHoursEstimate("");
    setPetCareNotes("");
    setMessage("");
    setStep(0);
    setFieldErrors({});
    setError(null);
    setPending(false);
  }, []);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open && !mounted) return;
    let cancelled = false;
    void fetch("/api/acompanamientos/breed-presets?species=dog", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { items?: unknown }) => {
        if (cancelled) return;
        const items = Array.isArray(data.items)
          ? data.items
              .map((x) => titleCaseBreedLabel(String(x ?? "")))
              .filter(Boolean)
          : [];
        const seen = new Set<string>();
        const out: string[] = [];
        for (const t of ["Mestizo", ...items]) {
          const k = t.toLowerCase();
          if (seen.has(k)) continue;
          seen.add(k);
          out.push(t);
        }
        setBreedOptions(out);
      })
      .catch(() => {
        if (!cancelled) setBreedOptions(["Mestizo"]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, mounted]);

  useEffect(() => {
    const onOpen = () => {
      if (closeTimer.current != null) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      resetFormFields();
      const sent = readInquirySentCookie();
      const stored = sent ? readInquirySummary() : null;
      setSummary(stored);
      setAlreadySent(sent);
      setDone(sent);
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
  }, [resetFormFields]);

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

  const updateDog = useCallback(
    (index: number, patch: Partial<InquiryDogDraft>) => {
      setDogs((prev) =>
        prev.map((dog, i) => (i === index ? { ...dog, ...patch } : dog)),
      );
    },
    [],
  );

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
        ...dogs.flatMap((_, i) => [
          `dog${i}-name`,
          `dog${i}-breed`,
          `dog${i}-age`,
          `dog${i}-sex`,
        ]),
        "ringColor",
      ];
      const firstKey = focusOrder.find((k) => nextErrors[k]);
      const focusId =
        firstKey === "eventType" ||
        firstKey === "ringColor" ||
        (firstKey?.endsWith("-sex") ?? false)
          ? null
          : firstKey === "dates"
            ? `${titleId}-date`
            : firstKey === "name" ||
                firstKey === "phone" ||
                firstKey === "email" ||
                firstKey === "venue"
              ? `${titleId}-${firstKey}`
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
        } else if (firstKey?.endsWith("-sex")) {
          document
            .getElementById(`${titleId}-${firstKey}`)
            ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } else if (firstKey === "ringColor") {
          document
            .getElementById(`${titleId}-ring-color`)
            ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      });
    },
    [dogs, titleId],
  );

  const collectErrors = useCallback(
    (forStep?: StepIndex): Record<string, string> => {
      const name = contactName.trim();
      const tel = phone.trim();
      const mail = email.trim();
      const place = venue.trim();
      const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const nextErrors: Record<string, string> = {};

      const checkContact = forStep == null || forStep === 0;
      const checkEvent = forStep == null || forStep === 1;
      const checkDog = forStep == null || forStep === 2;
      const checkExtras = forStep == null || forStep === 3;

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
        if (!dogs.length) {
          nextErrors["dog0-name"] = "Indica al menos un perro";
        }
        dogs.forEach((dog, idx) => {
          const label = dogs.length > 1 ? `del perro ${idx + 1}` : "del perro";
          if (!dog.name.trim()) {
            nextErrors[`dog${idx}-name`] = `Indica el nombre ${label}`;
          }
          if (!dog.breed.trim()) {
            nextErrors[`dog${idx}-breed`] = `Indica la raza o el tamaño ${label}`;
          }
          const ageRaw = dog.ageYears.trim().replace(",", ".");
          const ageNum = ageRaw === "" ? null : Number(ageRaw);
          if (
            ageNum != null &&
            (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 30)
          ) {
            nextErrors[`dog${idx}-age`] = `Revisa la edad ${label}`;
          }
          if (!dog.sex) {
            nextErrors[`dog${idx}-sex`] = `Indica el sexo ${label}`;
          }
        });
      }

      if (checkExtras && ringBox && !ringBoxColor) {
        nextErrors.ringColor = "Indica el color del portaalianzas";
      }
      if (checkExtras) {
        const jewelryErr = validateInquiryJewelryItems(jewelryItems);
        if (jewelryErr) nextErrors.jewelry = jewelryErr;
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
      dogs,
      ringBox,
      ringBoxColor,
      jewelryItems,
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
        if (key === "ringColor") return 3;
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
    const dogsPayload: InquiryDogSummary[] = dogs.map((dog) => {
      const ageRaw = dog.ageYears.trim().replace(",", ".");
      const ageNum = ageRaw === "" ? null : Number(ageRaw);
      return {
        name: dog.name.trim(),
        breed: titleCaseBreedLabel(dog.breed),
        ageYears:
          ageNum == null || !Number.isFinite(ageNum) ? null : ageNum,
        sex: dog.sex,
        sterilized: dog.sterilized,
      };
    });

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
          dogs: dogsPayload.map((d) => ({
            name: d.name,
            breed: d.breed || null,
            ageYears: d.ageYears,
            sex: d.sex,
            sterilized: d.sterilized,
          })),
          eventType,
          needsTransfer,
          pickupAddress: needsTransfer
            ? pickupAddress.trim() || null
            : null,
          deliveryAddress: needsTransfer
            ? deliveryAddress.trim() || null
            : null,
          ringBox,
          ringBoxColor: ringBox ? ringBoxColor : null,
          collarLeash,
          jewelryItems: jewelryItems.map((j) => ({
            productId: j.productId,
            name: j.name,
            imageUrl: j.imageUrl,
            optionLabel: j.optionLabel,
            variantKey: j.variantKey,
            quantity: j.quantity,
            unitPriceCents: j.unitPriceCents,
            customization: j.customization,
          })),
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
      const nextSummary: InquirySummary = {
        contactName: name,
        phone: tel,
        email: mail || null,
        eventType,
        eventDates: [...eventDates].sort(),
        venue: place,
        dogs: dogsPayload,
        needsTransfer,
        pickupAddress: needsTransfer
          ? pickupAddress.trim() || null
          : null,
        deliveryAddress: needsTransfer
          ? deliveryAddress.trim() || null
          : null,
        ringBox,
        ringBoxColor: ringBox ? ringBoxColor : null,
        collarLeash,
        jewelryItems,
        hoursEstimate: hoursEstimate.trim() || null,
        petCareNotes: petCareNotes.trim() || null,
        message: message.trim() || null,
      };
      markInquirySentCookie();
      saveInquirySummary(nextSummary);
      setSummary(nextSummary);
      resetFormFields();
      setAlreadySent(false);
      setDone(true);
    } catch {
      setError(
        "No se pudo conectar. Prueba de nuevo o escríbenos por WhatsApp.",
      );
    } finally {
      setPending(false);
    }
  };

  const startAnotherInquiry = () => {
    clearInquirySentCookie();
    clearInquirySummary();
    setSummary(null);
    resetFormFields();
    setAlreadySent(false);
    setDone(false);
    panelRef.current
      ?.querySelector(".acompanamiento-inquiry-sheet__body")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const summaryItems = summary ? summaryRows(summary) : [];

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
          {done ? (
            <div
              className="acompanamiento-inquiry-sheet__success"
              role="status"
              aria-live="polite"
            >
              <div
                className="acompanamiento-inquiry-sheet__success-icon"
                aria-hidden={true}
              >
                <InquirySuccessHeart />
              </div>
              <p className="acompanamiento-inquiry-sheet__success-eyebrow">
                {alreadySent ? "Solicitud enviada" : "Solicitud recibida"}
              </p>
              <h2
                id={titleId}
                className="acompanamiento-inquiry-sheet__success-title"
              >
                {alreadySent ? "Ya la tienes" : "¡Gracias!"}
              </h2>
              <p className="acompanamiento-inquiry-sheet__success-lead">
                {alreadySent
                  ? "Ya has enviado una solicitud de propuesta. El equipo de Maison Vigo te contactará; si necesitas actualizar algo, puedes enviar otra."
                  : "Hemos recibido tu solicitud. El equipo de Maison Vigo se pondrá en contacto contigo para afinar la propuesta."}
              </p>
              {summaryItems.length > 0 ? (
                <div className="acompanamiento-inquiry-sheet__summary">
                  <p className="acompanamiento-inquiry-sheet__summary-title">
                    Resumen
                  </p>
                  <dl className="acompanamiento-inquiry-sheet__summary-list">
                    {summaryItems.map((row) => (
                      <div
                        key={row.label}
                        className="acompanamiento-inquiry-sheet__summary-row"
                      >
                        <dt>{row.label}</dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}
              <div className="acompanamiento-inquiry-sheet__success-actions">
                {alreadySent ? (
                  <button
                    type="button"
                    className="acompanamiento-inquiry-sheet__submit"
                    onClick={startAnotherInquiry}
                  >
                    Enviar otra solicitud
                  </button>
                ) : null}
                <button
                  type="button"
                  className={
                    alreadySent
                      ? "acompanamiento-inquiry-sheet__submit acompanamiento-inquiry-sheet__submit--ghost"
                      : "acompanamiento-inquiry-sheet__submit"
                  }
                  onClick={closeModal}
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="acompanamiento-inquiry-sheet__eyebrow">
                Acompañamiento
              </p>
              <h2 id={titleId} className="acompanamiento-inquiry-sheet__title">
                Pide tu propuesta
              </h2>
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
                  <div className="acompanamiento-inquiry-sheet__dogs">
                    {dogs.map((dog, idx) => {
                      const nameId = `${titleId}-dog${idx}-name`;
                      const breedId = `${titleId}-dog${idx}-breed`;
                      const ageId = `${titleId}-dog${idx}-age`;
                      const sexId = `${titleId}-dog${idx}-sex`;
                      const nameErr = fieldErrors[`dog${idx}-name`];
                      const breedErr = fieldErrors[`dog${idx}-breed`];
                      const ageErr = fieldErrors[`dog${idx}-age`];
                      const sexErr = fieldErrors[`dog${idx}-sex`];
                      return (
                        <div
                          key={idx}
                          className="acompanamiento-inquiry-sheet__dog"
                        >
                          <div className="acompanamiento-inquiry-sheet__dog-head">
                            <p className="acompanamiento-inquiry-sheet__dog-title">
                              {dogs.length > 1
                                ? `Perro ${idx + 1}`
                                : "Tu perro"}
                            </p>
                            {dogs.length > 1 ? (
                              <button
                                type="button"
                                className="acompanamiento-inquiry-sheet__dog-remove"
                                onClick={() => {
                                  setDogs((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  );
                                  setFieldErrors((prev) => {
                                    const next = { ...prev };
                                    for (const key of Object.keys(next)) {
                                      if (key.startsWith(`dog${idx}-`)) {
                                        delete next[key];
                                      }
                                    }
                                    return next;
                                  });
                                }}
                              >
                                Quitar
                              </button>
                            ) : null}
                          </div>
                          <InquiryFloatField
                            id={nameId}
                            label="Nombre del perro"
                            error={nameErr}
                          >
                            <input
                              id={nameId}
                              value={dog.name}
                              onChange={(e) => {
                                updateDog(idx, { name: e.target.value });
                                clearFieldError(`dog${idx}-name`);
                              }}
                              placeholder="Nombre del perro"
                              aria-invalid={nameErr ? true : undefined}
                              aria-describedby={
                                nameErr ? `${nameId}-error` : undefined
                              }
                            />
                          </InquiryFloatField>
                          <div className="acompanamiento-inquiry-sheet__row">
                            <AcompanamientoInquiryBreedField
                              id={breedId}
                              label="Raza o tamaño"
                              value={dog.breed}
                              options={breedOptions}
                              error={breedErr}
                              onChange={(next) => {
                                updateDog(idx, { breed: next });
                                clearFieldError(`dog${idx}-breed`);
                              }}
                            />
                            <InquiryFloatField
                              id={ageId}
                              label="Edad (años)"
                              error={ageErr}
                            >
                              <input
                                id={ageId}
                                inputMode="decimal"
                                value={dog.ageYears}
                                onChange={(e) => {
                                  updateDog(idx, { ageYears: e.target.value });
                                  clearFieldError(`dog${idx}-age`);
                                }}
                                placeholder="Edad (años)"
                                aria-invalid={ageErr ? true : undefined}
                                aria-describedby={
                                  ageErr ? `${ageId}-error` : undefined
                                }
                              />
                            </InquiryFloatField>
                          </div>
                          <div
                            id={sexId}
                            className={
                              "acompanamiento-inquiry-sheet__choice" +
                              (sexErr
                                ? " acompanamiento-inquiry-sheet__choice--error"
                                : "")
                            }
                            role="group"
                            aria-label="Sexo"
                            aria-invalid={sexErr ? true : undefined}
                            aria-describedby={
                              sexErr ? `${sexId}-error` : undefined
                            }
                          >
                            <p className="acompanamiento-inquiry-sheet__choice-label">
                              Sexo
                            </p>
                            <div className="acompanamiento-inquiry-sheet__chips">
                              {DOG_SEX_OPTIONS.map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  className={
                                    "acompanamiento-inquiry-sheet__chip" +
                                    (dog.sex === opt.id
                                      ? " acompanamiento-inquiry-sheet__chip--active"
                                      : "")
                                  }
                                  aria-pressed={dog.sex === opt.id}
                                  onClick={() => {
                                    updateDog(idx, { sex: opt.id });
                                    clearFieldError(`dog${idx}-sex`);
                                  }}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                            {sexErr ? (
                              <p
                                id={`${sexId}-error`}
                                className="acompanamiento-inquiry-sheet__field-error"
                                role="alert"
                              >
                                {sexErr}
                              </p>
                            ) : null}
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
                                    (dog.sterilized === opt.value
                                      ? " acompanamiento-inquiry-sheet__chip--active"
                                      : "")
                                  }
                                  aria-pressed={dog.sterilized === opt.value}
                                  onClick={() =>
                                    updateDog(idx, {
                                      sterilized:
                                        dog.sterilized === opt.value
                                          ? null
                                          : opt.value,
                                    })
                                  }
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {dogs.length < MAX_INQUIRY_DOGS ? (
                    <button
                      type="button"
                      className="acompanamiento-inquiry-sheet__dog-add"
                      onClick={() =>
                        setDogs((prev) => [...prev, emptyDogDraft()])
                      }
                    >
                      Añadir otro perro
                    </button>
                  ) : null}
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
                        onChange={(e) => {
                          const on = e.target.checked;
                          setRingBox(on);
                          if (!on) {
                            setRingBoxColor(null);
                            clearFieldError("ringColor");
                          }
                        }}
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
                            de la pareja, el nombre de la mascota y la fecha del
                            evento.
                          </span>
                        </button>
                      </span>
                    </label>
                    {ringBox ? (
                      <div
                        id={`${titleId}-ring-color`}
                        className={
                          "acompanamiento-inquiry-sheet__choice" +
                          (fieldErrors.ringColor
                            ? " acompanamiento-inquiry-sheet__choice--error"
                            : "")
                        }
                        role="group"
                        aria-label="Color del portaalianzas"
                        aria-invalid={
                          fieldErrors.ringColor ? true : undefined
                        }
                        aria-describedby={
                          fieldErrors.ringColor
                            ? `${titleId}-ringColor-error`
                            : undefined
                        }
                      >
                        <p className="acompanamiento-inquiry-sheet__choice-label">
                          Color
                        </p>
                        <div className="acompanamiento-inquiry-sheet__chips">
                          {RING_COLOR_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              className={
                                "acompanamiento-inquiry-sheet__chip" +
                                (ringBoxColor === opt.id
                                  ? " acompanamiento-inquiry-sheet__chip--active"
                                  : "")
                              }
                              aria-pressed={ringBoxColor === opt.id}
                              onClick={() => {
                                setRingBoxColor(opt.id);
                                clearFieldError("ringColor");
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {fieldErrors.ringColor ? (
                          <p
                            id={`${titleId}-ringColor-error`}
                            className="acompanamiento-inquiry-sheet__field-error"
                            role="alert"
                          >
                            {fieldErrors.ringColor}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
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
                    <AcompanamientoInquiryJewelry
                      titleId={titleId}
                      value={jewelryItems}
                      onChange={setJewelryItems}
                    />
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
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
