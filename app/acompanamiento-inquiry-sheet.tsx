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

import { trackEvent } from "@/lib/analytics";
import { ACOMPANAMIENTO_INQUIRY_OPEN_EVENT } from "@/lib/care-assist";
import { careApiBaseUrl } from "@/lib/web-store/utils";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

import { AcompanamientoDateField } from "./acompanamiento-date-field";
import {
  AcompanamientoInquiryBreedField,
  titleCaseBreedLabel,
} from "./acompanamiento-inquiry-breed-field";
import type { InquiryJewelryItem } from "./acompanamiento-inquiry-jewelry";

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

type StepDef =
  | { id: "intro" }
  | { id: "names" }
  | { id: "eventType" }
  | { id: "dates" }
  | { id: "venue" }
  | { id: "dogNames" }
  | { id: "dogBreed"; dog: number }
  | { id: "dogTraits"; dog: number }
  | { id: "care" }
  | { id: "hours" }
  | { id: "transfer" }
  | { id: "included" }
  | { id: "contact" };

/** Flujo conversacional: una pregunta por pantalla. Los pasos de perro se repiten por cada perro. */
function buildSteps(
  dogCount: number,
  opts: { skipEventType: boolean },
): StepDef[] {
  const perDog: StepDef[] = [];
  for (let i = 0; i < Math.max(1, dogCount); i++) {
    perDog.push({ id: "dogBreed", dog: i }, { id: "dogTraits", dog: i });
  }
  return [
    { id: "intro" },
    { id: "names" },
    ...(opts.skipEventType ? [] : [{ id: "eventType" } as StepDef]),
    { id: "dates" },
    { id: "venue" },
    { id: "dogNames" },
    ...perDog,
    { id: "care" },
    { id: "hours" },
    { id: "transfer" },
    { id: "included" },
    { id: "contact" },
  ];
}

function stepKeyOf(s: StepDef): string {
  return "dog" in s ? `${s.id}-${s.dog}` : s.id;
}

type DateMode = "exact" | "approx";

const MONTH_LABELS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Próximos 18 meses para «aún no sabemos el día exacto». value = YYYY-MM */
function approxMonthOptions(): { value: string; month: string; year: number }[] {
  const now = new Date();
  const out: { value: string; month: string; year: number }[] = [];
  for (let i = 0; i < 18; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      month: MONTH_LABELS[d.getMonth()]!,
      year: d.getFullYear(),
    });
  }
  return out;
}

function approxMonthLabel(value: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return value;
  const label = MONTH_LABELS[Number(m[2]) - 1] ?? "";
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} de ${m[1]}`;
}

function todayDateKey(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

const HOURS_OPTIONS = ["1–2 horas", "3–4 horas", "Todo el día", "Aún no lo sé"];

const INTRO_STEPS = [
  {
    n: "01",
    title: "Nos contáis",
    text: "Fecha, lugar y cómo es vuestro perro. Sin compromiso.",
  },
  {
    n: "02",
    title: "Os preparamos la propuesta",
    text: "Afinamos presencia, tiempos y traslado con vosotros.",
  },
  {
    n: "03",
    title: "El gran día",
    text: "Estamos allí con calma para que podáis vivir el momento juntos.",
  },
] as const;

/** Ya incluidos en el servicio: se muestran, no se piden. */
const INCLUDED_ITEMS: { title: string; text: string }[] = [
  {
    title: "Portaalianzas",
    text: "Lo lleva vuestro perro, grabado con vuestras iniciales, su nombre y la fecha.",
  },
  {
    title: "Collar y correa especial",
    text: "En biothane, disponible en varios colores.",
  },
  {
    title: "Joyas personalizadas",
    text: "Un detalle a medida para que vaya a juego con el día.",
  },
];

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

/** QR del tótem de la feria Vigo Bodas (enlace bit.ly fijo, solo con UTM). */
function isVigoBodasQrUrl(url: URL): boolean {
  return url.searchParams.get("utm_source") === "vigo_bodas";
}

const VIGO_BODAS_SESSION_KEY = "mv_vigo_bodas_qr";

function markVigoBodasSession() {
  try {
    sessionStorage.setItem(VIGO_BODAS_SESSION_KEY, "1");
  } catch {
    /* private mode / blocked storage */
  }
}

function hasVigoBodasSession(): boolean {
  try {
    return sessionStorage.getItem(VIGO_BODAS_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function readLeadSourceFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const origen = url.searchParams.get("origen")?.trim();
  if (origen) return origen;
  if (isVigoBodasQrUrl(url)) return "vigo-bodas";
  return hasVigoBodasSession() ? "vigo-bodas" : null;
}

function shouldAutoOpenFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  if (!url.pathname.includes("/servicios/acompanamiento")) return false;
  if (isVigoBodasQrUrl(url)) return true;
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
  /* Conservamos el resto de parámetros (p. ej. utm_*) para que Analytics
     atribuya la visita al QR. */
  window.history.replaceState(
    window.history.state,
    "",
    url.pathname + url.search + url.hash,
  );
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
  /** «Aún no sabemos el día»: mes aproximado legible (p. ej. «Junio de 2027»). */
  dateApprox?: string | null;
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

function formatCoupleName(first: string, second: string): string {
  const a = first.trim();
  const b = second.trim();
  if (a && b) return `${a} y ${b}`;
  return a || b;
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
    { label: "Pareja", value: summary.contactName },
    { label: "Teléfono", value: summary.phone },
  ];
  if (summary.email) rows.push({ label: "Email", value: summary.email });
  rows.push(
    { label: "Evento", value: eventTypeLabel(summary.eventType) },
    {
      label: summary.eventDates.length > 1 ? "Fechas" : "Fecha",
      value: summary.dateApprox
        ? `${summary.dateApprox} (día por decidir)`
        : summary.eventDates.length
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
  rows.push({
    label: "Incluido",
    value: INCLUDED_ITEMS.map((i) => i.title).join(" · "),
  });
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

export type AcompanamientoInquirySheetProps = {
  /** Formulario fijo en página (stand `/vigo-bodas`), sin modal. */
  embedded?: boolean;
  /** Origen del lead si no viene de la URL (p. ej. stand). */
  defaultLeadSource?: string | null;
};

export function AcompanamientoInquirySheet({
  embedded = false,
  defaultLeadSource = null,
}: AcompanamientoInquirySheetProps = {}) {
  const titleId = useId();
  const [portalReady, setPortalReady] = useState(false);
  const [open, setOpen] = useState(embedded);
  const [mounted, setMounted] = useState(embedded);
  const [visible, setVisible] = useState(embedded);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  /** Reabrimos con cookie: mensaje “ya enviada” + CTA para otra. */
  const [alreadySent, setAlreadySent] = useState(false);
  const [summary, setSummary] = useState<InquirySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [partnerNameA, setPartnerNameA] = useState("");
  const [partnerNameB, setPartnerNameB] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventDates, setEventDates] = useState<string[]>([]);
  const [dateMode, setDateMode] = useState<DateMode | null>(null);
  const [approxMonth, setApproxMonth] = useState("");
  const [venue, setVenue] = useState("");
  const [dogs, setDogs] = useState<InquiryDogDraft[]>(() => [emptyDogDraft()]);
  const [breedOptions, setBreedOptions] = useState<string[]>(["Mestizo"]);
  const [eventType, setEventType] = useState<EventType | "">("boda");
  const [needsTransfer, setNeedsTransfer] = useState(false);
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [hoursEstimate, setHoursEstimate] = useState("");
  const [petCareNotes, setPetCareNotes] = useState("");
  const [message, setMessage] = useState("");
  const [leadSource, setLeadSource] = useState<string | null>(
    () => defaultLeadSource,
  );
  /** QR del tótem de la feria Vigo Bodas: saludo propio en el sheet. */
  const isVigoBodas = leadSource === "vigo-bodas";
  /** Tras cerrar el sheet al menos una vez en esta sesión QR. */
  const [vigoBodasDismissed, setVigoBodasDismissed] = useState(false);
  /** Burbuja flotante tras cerrar el modal (solo sesión Vigo Bodas). */
  const showVigoBodasBubble = isVigoBodas && vigoBodasDismissed && !mounted;
  /** Origen leído del deep-link antes de limpiar la URL (para analítica). */
  const autoLeadSourceRef = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const grabberRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const closeModalRef = useRef<() => void>(() => {});
  const startAnotherInquiryRef = useRef<() => void>(() => {});
  const autoOpenedRef = useRef(false);

  const resetFormFields = useCallback(() => {
    setPartnerNameA("");
    setPartnerNameB("");
    setPhone("");
    setEmail("");
    setEventDates([]);
    setDateMode(null);
    setApproxMonth("");
    setVenue("");
    setDogs([emptyDogDraft()]);
    setEventType("boda");
    setNeedsTransfer(false);
    setPickupAddress("");
    setDeliveryAddress("");
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
    if (defaultLeadSource) {
      autoLeadSourceRef.current = defaultLeadSource;
      setLeadSource((prev) => prev ?? defaultLeadSource);
      if (defaultLeadSource === "vigo-bodas") markVigoBodasSession();
    }
    const origen = readLeadSourceFromUrl();
    if (origen) {
      autoLeadSourceRef.current = origen;
      setLeadSource((prev) => prev ?? origen);
      if (origen === "vigo-bodas") markVigoBodasSession();
    }
  }, [defaultLeadSource]);

  useEffect(() => {
    if (isVigoBodas) markVigoBodasSession();
  }, [isVigoBodas]);

  useEffect(() => {
    if (!embedded) return;
    trackEvent("acompanamiento_form_open", {
      lead_source: defaultLeadSource ?? "vigo-bodas",
      embedded: true,
    });
  }, [embedded, defaultLeadSource]);

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
      /* Se conserva el borrador (campos y paso) si se cerró sin querer;
         solo se limpian errores y estado de envío. El formulario se vacía
         tras enviar o con «otra solicitud». */
      setFieldErrors({});
      setError(null);
      setPending(false);
      const sent = readInquirySentCookie();
      const stored = sent ? readInquirySummary() : null;
      setSummary(stored);
      setAlreadySent(sent);
      setDone(sent);
      setLeadSource((prev) => prev ?? readLeadSourceFromUrl());
      if (!sent) {
        trackEvent("acompanamiento_form_open", {
          lead_source: readLeadSourceFromUrl() ?? autoLeadSourceRef.current,
        });
      }
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
    if (origen) {
      autoLeadSourceRef.current = origen;
      setLeadSource(origen);
    }
    clearReservaQuery();
    const id = window.setTimeout(() => {
      document.body.dispatchEvent(
        new Event(ACOMPANAMIENTO_INQUIRY_OPEN_EVENT),
      );
    }, 700);
    return () => window.clearTimeout(id);
  }, []);

  const closeModal = useCallback(() => {
    if (embedded) {
      /* En el stand no se cierra: dejamos listo para otra solicitud. */
      startAnotherInquiryRef.current();
      return;
    }
    if (leadSource === "vigo-bodas" || autoLeadSourceRef.current === "vigo-bodas") {
      setVigoBodasDismissed(true);
    }
    setVisible(false);
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setMounted(false);
      closeTimer.current = null;
    }, 520);
  }, [embedded, leadSource]);
  closeModalRef.current = closeModal;

  useEffect(() => {
    if (embedded) return;
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
  }, [embedded, open]);

  useEffect(() => {
    if (embedded || !mounted) return;
    lockScroll();
    return () => unlockScroll();
  }, [embedded, mounted]);

  useEffect(() => {
    if (embedded || !mounted) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModalRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [embedded, mounted]);

  useEffect(() => {
    if (embedded || !mounted) return;
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
  }, [embedded, mounted]);

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

  const navigatedRef = useRef(false);
  /** Desde el QR de Vigo Bodas siempre es boda: no preguntamos el tipo de evento. */
  const steps = buildSteps(dogs.length, { skipEventType: isVigoBodas });
  const stepIndex = Math.min(step, steps.length - 1);
  const current = steps[stepIndex]!;
  const isLastStep = stepIndex === steps.length - 1;

  const dogDisplayName = useCallback(
    (idx: number) =>
      dogs[idx]?.name.trim() ||
      (dogs.length > 1 ? `el perro ${idx + 1}` : "vuestro perro"),
    [dogs],
  );

  const allDogNames = (() => {
    const names = dogs.map((_, i) => dogDisplayName(i));
    if (names.length <= 1) return names[0] ?? "vuestro perro";
    return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
  })();

  /** lo / la / los / las según sexo indicado. */
  const dogPronoun = (() => {
    if (dogs.length > 1) {
      return dogs.every((d) => d.sex === "female") ? "las" : "los";
    }
    return dogs[0]?.sex === "female" ? "la" : "lo";
  })();

  const focusFirstError = useCallback(
    (nextErrors: Record<string, string>) => {
      const firstKey = Object.keys(nextErrors)[0];
      if (!firstKey) return;
      window.setTimeout(() => {
        const el = document.getElementById(
          firstKey === "dates" ? `${titleId}-date` : `${titleId}-${firstKey}`,
        );
        if (!el) return;
        if (el.matches("input, textarea, button")) {
          el.focus({ preventScroll: false });
        } else {
          el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }, 60);
    },
    [titleId],
  );

  const collectErrors = useCallback(
    (only?: StepDef): Record<string, string> => {
      const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const nextErrors: Record<string, string> = {};
      const is = (id: StepDef["id"]) => only == null || only.id === id;
      const dogIndexes =
        only && "dog" in only ? [only.dog] : dogs.map((_, i) => i);

      if (is("names") && !partnerNameA.trim()) {
        nextErrors.nameA = "Dinos al menos tu nombre";
      }
      if (is("eventType") && !eventType) {
        nextErrors.eventType = "Elige una opción";
      }
      if (is("dates")) {
        if (!dateMode) {
          nextErrors.dateMode = "Elige una opción";
        } else if (dateMode === "exact") {
          if (!eventDates.length) {
            nextErrors.dates = "Elige el día";
          } else if (eventDates.some((d) => d < todayDateKey())) {
            nextErrors.dates = "La fecha no puede ser anterior a hoy";
          }
        } else if (!approxMonth) {
          nextErrors.approxMonth = "Elige el mes aproximado";
        }
      }
      if (is("dogNames")) {
        dogs.forEach((dog, idx) => {
          if (!dog.name.trim()) {
            nextErrors[`dog${idx}-name`] =
              dogs.length > 1 ? `¿Cómo se llama el perro ${idx + 1}?` : "¿Cómo se llama?";
          }
        });
      }
      if (is("dogBreed")) {
        dogIndexes.forEach((idx) => {
          const dog = dogs[idx];
          if (!dog) return;
          if (!dog.breed.trim()) {
            nextErrors[`dog${idx}-breed`] = "Indica la raza o el tamaño";
          }
          const ageRaw = dog.ageYears.trim().replace(",", ".");
          const ageNum = ageRaw === "" ? null : Number(ageRaw);
          if (
            ageNum != null &&
            (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 30)
          ) {
            nextErrors[`dog${idx}-age`] = "Revisa la edad";
          }
        });
      }
      if (is("contact")) {
        const tel = phone.trim();
        const mail = email.trim();
        if (!tel) nextErrors.phone = "Indica tu teléfono";
        else if (tel.replace(/\D/g, "").length < 7) {
          nextErrors.phone = "Indica un teléfono válido";
        }
        if (mail && !EMAIL_PATTERN.test(mail)) {
          nextErrors.email = "Revisa el formato del email";
        }
      }
      return nextErrors;
    },
    [partnerNameA, eventType, eventDates, dateMode, approxMonth, dogs, phone, email],
  );

  const scrollBodyTop = () => {
    panelRef.current
      ?.querySelector(".acompanamiento-inquiry-sheet__body")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    setError(null);
    const nextErrors = collectErrors(current);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return;
    }
    setFieldErrors({});
    navigatedRef.current = true;
    setStep(Math.min(steps.length - 1, stepIndex + 1));
    scrollBodyTop();
  };
  const goNextRef = useRef(goNext);
  useEffect(() => {
    goNextRef.current = goNext;
  });

  const goBack = () => {
    setError(null);
    setFieldErrors({});
    navigatedRef.current = true;
    setStep(Math.max(0, stepIndex - 1));
    scrollBodyTop();
  };

  /** Tras elegir un chip de respuesta única, avanzamos solos (con estado ya actualizado). */
  const [autoAdvanceTick, setAutoAdvanceTick] = useState(0);
  useEffect(() => {
    if (!autoAdvanceTick) return;
    const id = window.setTimeout(() => goNextRef.current(), 280);
    return () => window.clearTimeout(id);
  }, [autoAdvanceTick]);
  const pickAndAdvance = (apply: () => void) => {
    apply();
    setAutoAdvanceTick((t) => t + 1);
  };

  /** Foco en el primer campo de texto al cambiar de pregunta (no al abrir). */
  useEffect(() => {
    if (!navigatedRef.current) return;
    navigatedRef.current = false;
    const id = window.setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>(
        ".acompanamiento-inquiry-sheet__step input:not([type=checkbox]):not([inputmode=none]):not([data-nofocus]), .acompanamiento-inquiry-sheet__step textarea:not([data-nofocus])",
      );
      if (el && !el.closest(".acompanamiento-inquiry-sheet__field--date")) {
        el.focus({ preventScroll: true });
      }
    }, 320);
    return () => window.clearTimeout(id);
  }, [stepIndex]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isLastStep) {
      goNext();
      return;
    }

    const nextErrors = collectErrors();
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const target = steps.findIndex(
        (s) => Object.keys(collectErrors(s)).length > 0,
      );
      if (target >= 0) setStep(target);
      focusFirstError(nextErrors);
      return;
    }

    const name = formatCoupleName(partnerNameA, partnerNameB);
    const tel = phone.trim();
    const mail = email.trim();
    const place = venue.trim() || "Sin decidir";
    /* La API exige una fecha: si aún no saben el día, enviamos el primer día
       (posible) del mes elegido y lo dejamos claro en el mensaje. */
    const approxLabel =
      dateMode === "approx" && approxMonth ? approxMonthLabel(approxMonth) : null;
    const datesOut =
      dateMode === "approx" && approxMonth
        ? [
            `${approxMonth}-01` < todayDateKey()
              ? todayDateKey()
              : `${approxMonth}-01`,
          ]
        : eventDates.slice(0, 1);
    const messageOut =
      [
        approxLabel
          ? `Fecha aproximada: ${approxLabel} (aún sin día exacto).`
          : null,
        message.trim() || null,
      ]
        .filter(Boolean)
        .join("\n\n") || null;
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
          eventDates: datesOut,
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
          /* Portaalianzas, collar/correa y joyas van incluidos en el servicio:
             no se piden en el formulario, se concretan después con la pareja. */
          jewelryItems: [],
          hoursEstimate: hoursEstimate.trim() || null,
          petCareNotes: petCareNotes.trim() || null,
          message: messageOut,
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
        eventDates: datesOut,
        dateApprox: approxLabel,
        venue: place,
        dogs: dogsPayload,
        needsTransfer,
        pickupAddress: needsTransfer
          ? pickupAddress.trim() || null
          : null,
        deliveryAddress: needsTransfer
          ? deliveryAddress.trim() || null
          : null,
        ringBox: false,
        ringBoxColor: null,
        collarLeash: false,
        jewelryItems: [],
        hoursEstimate: hoursEstimate.trim() || null,
        petCareNotes: petCareNotes.trim() || null,
        message: message.trim() || null,
      };
      trackEvent("generate_lead", {
        form_name: "acompanamiento",
        lead_source: leadSource,
        event_type: eventType,
      });
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
  startAnotherInquiryRef.current = startAnotherInquiry;

  const summaryItems = summary ? summaryRows(summary) : [];

  const reopenFromBubble = () => {
    trackEvent("acompanamiento_vigo_bodas_bubble_click", {
      lead_source: "vigo-bodas",
    });
    document.body.dispatchEvent(new Event(ACOMPANAMIENTO_INQUIRY_OPEN_EVENT));
  };

  if (!portalReady || (!embedded && !mounted && !showVigoBodasBubble)) return null;

  const sheet = mounted || embedded ? (
    <div
      className={
        "acompanamiento-inquiry-sheet" +
        (embedded ? " acompanamiento-inquiry-sheet--embedded" : "") +
        (visible || embedded ? " acompanamiento-inquiry-sheet--visible" : "")
      }
      role="presentation"
      onClick={(e) => {
        if (embedded) return;
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        ref={panelRef}
        className="acompanamiento-inquiry-sheet__panel"
        role="dialog"
        aria-modal={embedded ? undefined : true}
        aria-labelledby={titleId}
      >
        {embedded ? null : (
          <>
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
          </>
        )}
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
                {alreadySent || embedded ? (
                  <button
                    type="button"
                    className="acompanamiento-inquiry-sheet__submit"
                    onClick={startAnotherInquiry}
                  >
                    Enviar otra solicitud
                  </button>
                ) : null}
                {embedded ? null : (
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
                )}
              </div>
            </div>
          ) : (
            <>
              {(() => {
                const optionalEmpty =
                  (current.id === "venue" && !venue.trim()) ||
                  (current.id === "care" && !petCareNotes.trim()) ||
                  (current.id === "hours" && !hoursEstimate.trim());
                const primaryLabel = current.id === "intro"
                  ? "Pedir nuestra propuesta"
                  : isLastStep
                  ? pending
                    ? "Enviando…"
                    : "Enviar solicitud"
                  : optionalEmpty
                    ? "Saltar"
                    : "Continuar";
                const nameA = partnerNameA.trim();
                const nameB = partnerNameB.trim();
                const isIntro = current.id === "intro";
                const questionCount = steps.length - 1;
                const progressPct = Math.round(
                  (stepIndex / questionCount) * 100,
                );
                const prevId = steps[stepIndex - 1]?.id;

                let greeting: string | null = null;
                let question = "";
                let lead: string | null = null;
                switch (current.id) {
                  case "intro":
                    question = isVigoBodas
                      ? "Que vuestro perro también esté en el gran día"
                      : "Que vuestro perro forme parte del día";
                    break;
                  case "names":
                    greeting = "Empecemos";
                    question = "¿Cómo os llamáis?";
                    break;
                  case "eventType":
                    greeting = `Encantados, ${formatCoupleName(nameA, nameB)}`;
                    question = "¿Qué celebráis?";
                    break;
                  case "dates":
                    if (prevId === "names") {
                      greeting = `Encantados, ${formatCoupleName(nameA, nameB)}`;
                    }
                    question =
                      eventType === "boda"
                        ? "¿Cuándo es el gran día?"
                        : "¿Qué día es el evento?";
                    break;
                  case "venue":
                    question = "¿Dónde lo celebráis?";
                    lead =
                      "Finca, pazo, restaurante o municipio. Si aún no lo sabéis, podéis saltarlo.";
                    break;
                  case "dogNames":
                    greeting = "Ahora lo más importante";
                    question = "¿Cómo se llama vuestro perro?";
                    lead = "¿Viene más de uno? Podéis añadirlo abajo.";
                    break;
                  case "dogBreed":
                    question = `¿Cómo es ${dogDisplayName(current.dog)}?`;
                    lead = "Su raza (o tamaño, si es mestizo) y edad aproximada.";
                    break;
                  case "dogTraits":
                    question = `Un par de detalles sobre ${dogDisplayName(current.dog)}`;
                    lead = "Opcional, pero nos ayuda a preparar el día.";
                    break;
                  case "care":
                    question = `¿Algo que debamos saber de ${allDogNames}?`;
                    lead =
                      "Carácter, miedos, cuidados especiales… Todo suma para que esté a gusto ese día.";
                    break;
                  case "hours":
                    question = "¿Cuánto tiempo queréis que os acompañemos?";
                    lead = "Aproximado, lo afinamos después.";
                    break;
                  case "transfer":
                    question = `¿Recogemos a ${allDogNames} y ${dogPronoun} llevamos al evento?`;
                    lead = "Y de vuelta a casa, si lo necesitáis.";
                    break;
                  case "included":
                    greeting = "Buenas noticias";
                    question = "Esto ya va incluido";
                    lead =
                      "No tenéis que elegir nada ahora: lo personalizamos juntos al preparar vuestra propuesta.";
                    break;
                  case "contact":
                    greeting = "Último paso";
                    question = "¿Dónde os enviamos la propuesta?";
                    lead = "Os escribimos por WhatsApp o email, sin compromiso.";
                    break;
                }

                const dogIdx = "dog" in current ? current.dog : 0;
                const dog = dogs[dogIdx];

                return (
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

                    {!isIntro ? (
                    <div
                      className="acompanamiento-inquiry-sheet__progress"
                      role="progressbar"
                      aria-label={`Pregunta ${stepIndex} de ${questionCount}`}
                      aria-valuemin={1}
                      aria-valuemax={questionCount}
                      aria-valuenow={stepIndex}
                    >
                      <p className="acompanamiento-inquiry-sheet__eyebrow">
                        {isVigoBodas ? "Vigo Bodas" : "Acompañamiento"}
                      </p>
                      <span className="acompanamiento-inquiry-sheet__progress-bar">
                        <span
                          className="acompanamiento-inquiry-sheet__progress-fill"
                          style={{ width: `${progressPct}%` }}
                        />
                      </span>
                    </div>
                    ) : null}

                    <div
                      key={stepKeyOf(current)}
                      className={
                        "acompanamiento-inquiry-sheet__step" +
                        (isIntro ? " acompanamiento-inquiry-sheet__step--intro" : "")
                      }
                    >
                      {isIntro ? (
                        <>
                          <div
                            className="acompanamiento-inquiry-sheet__intro-media"
                            aria-hidden={true}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/acompanamiento.webp" alt="" />
                          </div>
                          <p className="acompanamiento-inquiry-sheet__eyebrow">
                            {isVigoBodas
                              ? "Vigo Bodas · Acompañamiento canino"
                              : "Acompañamiento canino"}
                          </p>
                        </>
                      ) : null}
                      {greeting ? (
                        <p className="acompanamiento-inquiry-sheet__greeting">
                          {greeting}
                        </p>
                      ) : null}
                      <h2
                        id={titleId}
                        className="acompanamiento-inquiry-sheet__title acompanamiento-inquiry-sheet__question"
                      >
                        {question}
                      </h2>
                      {lead ? (
                        <p className="acompanamiento-inquiry-sheet__lead">
                          {lead}
                        </p>
                      ) : null}

                      <div className="acompanamiento-inquiry-sheet__answer">
                        {isIntro ? (
                          <div className="acompanamiento-inquiry-sheet__intro">
                            <p className="acompanamiento-inquiry-sheet__intro-text">
                              {isVigoBodas
                                ? "Estamos presentes en vuestra boda cuidando de vuestro perro, para que podáis tenerlo cerca y vivir ese momento juntos, con la misma calma y atención de siempre."
                                : "Estamos presentes en bodas, celebraciones y días especiales cuidando de vuestro perro, para que podáis vivir ese momento juntos, con la misma calma y atención de siempre."}
                            </p>
                            <ol className="acompanamiento-inquiry-sheet__intro-steps">
                              {INTRO_STEPS.map((it) => (
                                <li key={it.n}>
                                  <span className="acompanamiento-inquiry-sheet__intro-n">
                                    {it.n}
                                  </span>
                                  <span>
                                    <span className="acompanamiento-inquiry-sheet__intro-title">
                                      {it.title}
                                    </span>
                                    <span className="acompanamiento-inquiry-sheet__intro-desc">
                                      {it.text}
                                    </span>
                                  </span>
                                </li>
                              ))}
                            </ol>
                            <p className="acompanamiento-inquiry-sheet__intro-included">
                              Incluye portaalianzas, collar y correa especial y
                              joyas personalizadas.
                            </p>
                          </div>
                        ) : null}

                        {current.id === "names" ? (
                          <>
                            <InquiryFloatField
                              id={`${titleId}-nameA`}
                              label="Tu nombre"
                              error={fieldErrors.nameA}
                            >
                              <input
                                id={`${titleId}-nameA`}
                                value={partnerNameA}
                                onChange={(e) => {
                                  setPartnerNameA(e.target.value);
                                  clearFieldError("nameA");
                                }}
                                autoComplete="given-name"
                                autoCapitalize="words"
                                enterKeyHint="next"
                                placeholder="Tu nombre"
                                aria-invalid={fieldErrors.nameA ? true : undefined}
                                aria-describedby={
                                  fieldErrors.nameA
                                    ? `${titleId}-nameA-error`
                                    : undefined
                                }
                              />
                            </InquiryFloatField>
                            <InquiryFloatField
                              id={`${titleId}-nameB`}
                              label="Y tu pareja (opcional)"
                            >
                              <input
                                id={`${titleId}-nameB`}
                                value={partnerNameB}
                                onChange={(e) => setPartnerNameB(e.target.value)}
                                autoComplete="off"
                                autoCapitalize="words"
                                enterKeyHint="next"
                                placeholder="Y tu pareja (opcional)"
                              />
                            </InquiryFloatField>
                          </>
                        ) : null}

                        {current.id === "eventType" ? (
                          <>
                            <div
                              id={`${titleId}-eventType`}
                              className="acompanamiento-inquiry-sheet__options"
                              role="group"
                              aria-label="Tipo de evento"
                            >
                              {EVENT_TYPES.map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  className={
                                    "acompanamiento-inquiry-sheet__option" +
                                    (eventType === t.id ? " is-active" : "")
                                  }
                                  aria-pressed={eventType === t.id}
                                  onClick={() =>
                                    pickAndAdvance(() => {
                                      setEventType(t.id);
                                      clearFieldError("eventType");
                                    })
                                  }
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>
                            {fieldErrors.eventType ? (
                              <p
                                className="acompanamiento-inquiry-sheet__field-error acompanamiento-inquiry-sheet__field-error--static"
                                role="alert"
                              >
                                {fieldErrors.eventType}
                              </p>
                            ) : null}
                          </>
                        ) : null}

                        {current.id === "dates" ? (
                          <>
                            <div
                              id={`${titleId}-dateMode`}
                              className="acompanamiento-inquiry-sheet__options"
                              role="group"
                              aria-label="¿Tenéis fecha?"
                            >
                              <button
                                type="button"
                                className={
                                  "acompanamiento-inquiry-sheet__option" +
                                  (dateMode === "exact" ? " is-active" : "")
                                }
                                aria-pressed={dateMode === "exact"}
                                onClick={() => {
                                  setDateMode("exact");
                                  setFieldErrors({});
                                }}
                              >
                                Ya tenemos el día
                              </button>
                              <button
                                type="button"
                                className={
                                  "acompanamiento-inquiry-sheet__option" +
                                  (dateMode === "approx" ? " is-active" : "")
                                }
                                aria-pressed={dateMode === "approx"}
                                onClick={() => {
                                  setDateMode("approx");
                                  setFieldErrors({});
                                }}
                              >
                                Aún no sabemos el día exacto
                              </button>
                            </div>
                            {fieldErrors.dateMode ? (
                              <p
                                className="acompanamiento-inquiry-sheet__field-error acompanamiento-inquiry-sheet__field-error--static"
                                role="alert"
                              >
                                {fieldErrors.dateMode}
                              </p>
                            ) : null}
                            {dateMode === "exact" ? (
                              <AcompanamientoDateField
                                key="exact"
                                id={`${titleId}-date`}
                                single
                                openOnMount
                                value={eventDates.slice(0, 1)}
                                onChange={(next) =>
                                  pickAndAdvance(() => {
                                    setEventDates(next.slice(0, 1));
                                    clearFieldError("dates");
                                  })
                                }
                                error={fieldErrors.dates ?? null}
                              />
                            ) : null}
                            {dateMode === "approx" ? (
                              <div
                                id={`${titleId}-approxMonth`}
                                className="acompanamiento-inquiry-sheet__choice"
                                role="group"
                                aria-label="Mes aproximado"
                              >
                                <p className="acompanamiento-inquiry-sheet__choice-label">
                                  ¿Más o menos cuándo?
                                </p>
                                <div className="acompanamiento-inquiry-sheet__months">
                                  {approxMonthOptions().map((m, i, all) => (
                                    <button
                                      key={m.value}
                                      type="button"
                                      className={
                                        "acompanamiento-inquiry-sheet__month" +
                                        (approxMonth === m.value ? " is-active" : "")
                                      }
                                      aria-pressed={approxMonth === m.value}
                                      onClick={() =>
                                        pickAndAdvance(() => {
                                          setApproxMonth(m.value);
                                          clearFieldError("approxMonth");
                                        })
                                      }
                                    >
                                      <span>{m.month}</span>
                                      {i === 0 || all[i - 1]!.year !== m.year ? (
                                        <small>{m.year}</small>
                                      ) : null}
                                    </button>
                                  ))}
                                </div>
                                {fieldErrors.approxMonth ? (
                                  <p
                                    className="acompanamiento-inquiry-sheet__field-error acompanamiento-inquiry-sheet__field-error--static"
                                    role="alert"
                                  >
                                    {fieldErrors.approxMonth}
                                  </p>
                                ) : null}
                              </div>
                            ) : null}
                          </>
                        ) : null}

                        {current.id === "venue" ? (
                          <InquiryFloatField
                            id={`${titleId}-venue`}
                            label="Lugar o municipio"
                          >
                            <input
                              id={`${titleId}-venue`}
                              value={venue}
                              onChange={(e) => setVenue(e.target.value)}
                              enterKeyHint="next"
                              placeholder="Lugar o municipio"
                            />
                          </InquiryFloatField>
                        ) : null}

                        {current.id === "dogNames" ? (
                          <>
                            {dogs.map((d, idx) => {
                              const nameId = `${titleId}-dog${idx}-name`;
                              const nameErr = fieldErrors[`dog${idx}-name`];
                              return (
                                <div
                                  key={idx}
                                  className="acompanamiento-inquiry-sheet__dog-name-row"
                                >
                                  <InquiryFloatField
                                    id={nameId}
                                    label={
                                      dogs.length > 1
                                        ? `Nombre del perro ${idx + 1}`
                                        : "Su nombre"
                                    }
                                    error={nameErr}
                                  >
                                    <input
                                      id={nameId}
                                      value={d.name}
                                      onChange={(e) => {
                                        updateDog(idx, { name: e.target.value });
                                        clearFieldError(`dog${idx}-name`);
                                      }}
                                      autoCapitalize="words"
                                      enterKeyHint="next"
                                      placeholder={
                                        dogs.length > 1
                                          ? `Nombre del perro ${idx + 1}`
                                          : "Su nombre"
                                      }
                                      aria-invalid={nameErr ? true : undefined}
                                      aria-describedby={
                                        nameErr ? `${nameId}-error` : undefined
                                      }
                                    />
                                  </InquiryFloatField>
                                  {dogs.length > 1 ? (
                                    <button
                                      type="button"
                                      className="acompanamiento-inquiry-sheet__dog-remove"
                                      aria-label={`Quitar ${d.name.trim() || `perro ${idx + 1}`}`}
                                      onClick={() => {
                                        setDogs((prev) =>
                                          prev.filter((_, i) => i !== idx),
                                        );
                                        setFieldErrors({});
                                      }}
                                    >
                                      Quitar
                                    </button>
                                  ) : null}
                                </div>
                              );
                            })}
                            {dogs.length < MAX_INQUIRY_DOGS ? (
                              <button
                                type="button"
                                className="acompanamiento-inquiry-sheet__dog-add"
                                onClick={() =>
                                  setDogs((prev) => [...prev, emptyDogDraft()])
                                }
                              >
                                + Añadir otro perro
                              </button>
                            ) : null}
                          </>
                        ) : null}

                        {current.id === "dogBreed" && dog ? (
                          <>
                            <AcompanamientoInquiryBreedField
                              id={`${titleId}-dog${dogIdx}-breed`}
                              label="Raza o tamaño"
                              value={dog.breed}
                              options={breedOptions}
                              error={fieldErrors[`dog${dogIdx}-breed`]}
                              onChange={(next) => {
                                updateDog(dogIdx, { breed: next });
                                clearFieldError(`dog${dogIdx}-breed`);
                              }}
                            />
                            <InquiryFloatField
                              id={`${titleId}-dog${dogIdx}-age`}
                              label="Edad en años (opcional)"
                              error={fieldErrors[`dog${dogIdx}-age`]}
                            >
                              <input
                                id={`${titleId}-dog${dogIdx}-age`}
                                inputMode="decimal"
                                enterKeyHint="next"
                                value={dog.ageYears}
                                onChange={(e) => {
                                  updateDog(dogIdx, { ageYears: e.target.value });
                                  clearFieldError(`dog${dogIdx}-age`);
                                }}
                                placeholder="Edad en años (opcional)"
                                aria-invalid={
                                  fieldErrors[`dog${dogIdx}-age`] ? true : undefined
                                }
                              />
                            </InquiryFloatField>
                          </>
                        ) : null}

                        {current.id === "dogTraits" && dog ? (
                          <>
                            <div
                              className="acompanamiento-inquiry-sheet__choice"
                              role="group"
                              aria-label="Sexo"
                            >
                              <p className="acompanamiento-inquiry-sheet__choice-label">
                                Es…
                              </p>
                              <div className="acompanamiento-inquiry-sheet__options acompanamiento-inquiry-sheet__options--inline">
                                {DOG_SEX_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className={
                                      "acompanamiento-inquiry-sheet__option" +
                                      (dog.sex === opt.id ? " is-active" : "")
                                    }
                                    aria-pressed={dog.sex === opt.id}
                                    onClick={() =>
                                      updateDog(dogIdx, {
                                        sex: dog.sex === opt.id ? null : opt.id,
                                      })
                                    }
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div
                              className="acompanamiento-inquiry-sheet__choice"
                              role="group"
                              aria-label="Esterilizado"
                            >
                              <p className="acompanamiento-inquiry-sheet__choice-label">
                                {dog.sex === "female"
                                  ? "¿Está esterilizada?"
                                  : "¿Está esterilizado?"}
                              </p>
                              <div className="acompanamiento-inquiry-sheet__options acompanamiento-inquiry-sheet__options--inline">
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
                                      "acompanamiento-inquiry-sheet__option" +
                                      (dog.sterilized === opt.value
                                        ? " is-active"
                                        : "")
                                    }
                                    aria-pressed={dog.sterilized === opt.value}
                                    onClick={() =>
                                      updateDog(dogIdx, {
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
                          </>
                        ) : null}

                        {current.id === "care" ? (
                          <InquiryFloatField
                            id={`${titleId}-care`}
                            label="Cuéntanos (opcional)"
                          >
                            <textarea
                              id={`${titleId}-care`}
                              rows={4}
                              value={petCareNotes}
                              onChange={(e) => setPetCareNotes(e.target.value)}
                              maxLength={2000}
                              placeholder="Cuéntanos (opcional)"
                            />
                          </InquiryFloatField>
                        ) : null}

                        {current.id === "hours" ? (
                          <div
                            className="acompanamiento-inquiry-sheet__options"
                            role="group"
                            aria-label="Horas de acompañamiento"
                          >
                            {HOURS_OPTIONS.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                className={
                                  "acompanamiento-inquiry-sheet__option" +
                                  (hoursEstimate === opt ? " is-active" : "")
                                }
                                aria-pressed={hoursEstimate === opt}
                                onClick={() =>
                                  pickAndAdvance(() => setHoursEstimate(opt))
                                }
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : null}

                        {current.id === "transfer" ? (
                          <>
                            <div
                              className="acompanamiento-inquiry-sheet__options"
                              role="group"
                              aria-label="Recogida y traslado"
                            >
                              <button
                                type="button"
                                className={
                                  "acompanamiento-inquiry-sheet__option" +
                                  (needsTransfer ? " is-active" : "")
                                }
                                aria-pressed={needsTransfer}
                                onClick={() => setNeedsTransfer(true)}
                              >
                                Sí, por favor
                              </button>
                              <button
                                type="button"
                                className={
                                  "acompanamiento-inquiry-sheet__option" +
                                  (!needsTransfer ? " is-active" : "")
                                }
                                aria-pressed={!needsTransfer}
                                onClick={() =>
                                  pickAndAdvance(() => setNeedsTransfer(false))
                                }
                              >
                                No, nos encargamos nosotros
                              </button>
                            </div>
                            {needsTransfer ? (
                              <>
                                <InquiryFloatField
                                  id={`${titleId}-pickup`}
                                  label="Dirección de recogida (opcional)"
                                >
                                  <input
                                    id={`${titleId}-pickup`}
                                    value={pickupAddress}
                                    onChange={(e) => setPickupAddress(e.target.value)}
                                    enterKeyHint="next"
                                    placeholder="Dirección de recogida (opcional)"
                                  />
                                </InquiryFloatField>
                                <InquiryFloatField
                                  id={`${titleId}-delivery`}
                                  label="Dirección de vuelta (opcional)"
                                >
                                  <input
                                    id={`${titleId}-delivery`}
                                    value={deliveryAddress}
                                    onChange={(e) =>
                                      setDeliveryAddress(e.target.value)
                                    }
                                    enterKeyHint="next"
                                    placeholder="Dirección de vuelta (opcional)"
                                  />
                                </InquiryFloatField>
                              </>
                            ) : null}
                          </>
                        ) : null}

                        {current.id === "included" ? (
                          <>
                            <ul className="acompanamiento-inquiry-sheet__included">
                              {INCLUDED_ITEMS.map((item) => (
                                <li
                                  key={item.title}
                                  className="acompanamiento-inquiry-sheet__included-item"
                                >
                                  <span
                                    className="acompanamiento-inquiry-sheet__included-check"
                                    aria-hidden={true}
                                  >
                                    <svg viewBox="0 0 16 16" fill="none">
                                      <path
                                        d="M3.5 8.5l3 3 6-7"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </span>
                                  <span>
                                    <span className="acompanamiento-inquiry-sheet__included-title">
                                      {item.title}
                                    </span>
                                    <span className="acompanamiento-inquiry-sheet__included-text">
                                      {item.text}
                                    </span>
                                  </span>
                                  <span className="acompanamiento-inquiry-sheet__included-badge">
                                    Incluido
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <InquiryFloatField
                              id={`${titleId}-message`}
                              label="¿Algo más que queráis contarnos? (opcional)"
                            >
                              <textarea
                                id={`${titleId}-message`}
                                rows={3}
                                data-nofocus=""
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                maxLength={2000}
                                placeholder="¿Algo más que queráis contarnos? (opcional)"
                              />
                            </InquiryFloatField>
                          </>
                        ) : null}

                        {current.id === "contact" ? (
                          <>
                            <InquiryFloatField
                              id={`${titleId}-phone`}
                              label="Teléfono"
                              error={fieldErrors.phone}
                            >
                              <input
                                id={`${titleId}-phone`}
                                type="tel"
                                inputMode="tel"
                                value={phone}
                                onChange={(e) => {
                                  setPhone(e.target.value);
                                  clearFieldError("phone");
                                }}
                                autoComplete="tel"
                                enterKeyHint="next"
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
                              label="Email (opcional)"
                              error={fieldErrors.email}
                            >
                              <input
                                id={`${titleId}-email`}
                                type="email"
                                inputMode="email"
                                value={email}
                                onChange={(e) => {
                                  setEmail(e.target.value);
                                  clearFieldError("email");
                                }}
                                autoComplete="email"
                                enterKeyHint="send"
                                placeholder="Email (opcional)"
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
                      </div>
                    </div>

                    {isIntro ? (
                      <p className="acompanamiento-inquiry-sheet__intro-note">
                        Unas preguntas rápidas · menos de 2 minutos · sin compromiso
                      </p>
                    ) : null}
                    {error ? (
                      <p className="acompanamiento-inquiry-sheet__error" role="alert">
                        {error}
                      </p>
                    ) : null}

                    <div className="acompanamiento-inquiry-sheet__nav">
                      {stepIndex > 1 ? (
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
                      <button
                        type="submit"
                        className={
                          "acompanamiento-inquiry-sheet__submit" +
                          (optionalEmpty
                            ? " acompanamiento-inquiry-sheet__submit--ghost"
                            : "")
                        }
                        disabled={isLastStep && pending}
                      >
                        {primaryLabel}
                      </button>
                    </div>
                  </form>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  ) : null;

  if (embedded) return sheet;

  return createPortal(
    <>
      {showVigoBodasBubble ? (
        <div className="acompanamiento-vigo-bodas-dock">
          <button
            type="button"
            className="acompanamiento-vigo-bodas-bubble"
            onClick={reopenFromBubble}
            aria-label="Abrir solicitud Vigo Bodas"
          >
            <span className="acompanamiento-vigo-bodas-bubble__dot" aria-hidden={true} />
            <span className="acompanamiento-vigo-bodas-bubble__label">
              Vigo Bodas
            </span>
            <span className="acompanamiento-vigo-bodas-bubble__cta">
              Pide tu propuesta
            </span>
          </button>
        </div>
      ) : null}
      {sheet}
    </>,
    document.body,
  );
}
