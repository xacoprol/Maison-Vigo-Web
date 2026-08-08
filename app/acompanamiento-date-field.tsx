"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"] as const;

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toKey(y: number, m0: number, d: number) {
  return `${y}-${pad2(m0 + 1)}-${pad2(d)}`;
}

function parseKey(key: string): { y: number; m0: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || !mo || !d) return null;
  return { y, m0: mo - 1, d };
}

function formatShort(key: string) {
  const p = parseKey(key);
  if (!p) return key;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(new Date(p.y, p.m0, p.d));
}

function formatTriggerLabel(values: string[]) {
  if (!values.length) return "Fechas del evento";
  const sorted = [...values].sort();
  if (sorted.length === 1) {
    const p = parseKey(sorted[0]!)!;
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(p.y, p.m0, p.d));
  }
  return sorted.map(formatShort).join(" · ");
}

function todayKey() {
  const now = new Date();
  return toKey(now.getFullYear(), now.getMonth(), now.getDate());
}

function maxKey() {
  const now = new Date();
  return toKey(now.getFullYear() + 3, now.getMonth(), now.getDate());
}

/** Rango inclusivo YYYY-MM-DD (días civiles locales). */
function keysBetween(a: string, b: string): string[] {
  const start = a < b ? a : b;
  const end = a < b ? b : a;
  const from = parseKey(start);
  const to = parseKey(end);
  if (!from || !to) return [];
  const out: string[] = [];
  const cur = new Date(from.y, from.m0, from.d);
  const last = new Date(to.y, to.m0, to.d);
  while (cur.getTime() <= last.getTime()) {
    out.push(toKey(cur.getFullYear(), cur.getMonth(), cur.getDate()));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

type Props = {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  required?: boolean;
};

export function AcompanamientoDateField({
  id,
  value,
  onChange,
  required,
}: Props) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);
  const min = useMemo(() => todayKey(), []);
  const max = useMemo(() => maxKey(), []);
  const selected = useMemo(
    () => new Set(value.filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))),
    [value],
  );

  const initial =
    parseKey([...selected].sort()[0] ?? "") ?? parseKey(min)!;
  const [viewY, setViewY] = useState(initial.y);
  const [viewM0, setViewM0] = useState(initial.m0);

  useEffect(() => {
    if (!open) return;
    const first = [...selected].sort()[0];
    const p = first ? parseKey(first) : null;
    if (p) {
      setViewY(p.y);
      setViewM0(p.m0);
    }
  }, [open, selected]);

  useEffect(() => {
    if (!open) {
      setPanelHeight(null);
      return;
    }
    const syncHeight = () => {
      const root = rootRef.current;
      const trigger = root?.querySelector<HTMLElement>(
        ".acompanamiento-inquiry-sheet__date-trigger",
      );
      const form = root?.closest("form");
      if (!root || !trigger || !form) return;
      const gap = 4;
      const top = trigger.getBoundingClientRect().bottom + gap;
      const bottom = form.getBoundingClientRect().bottom;
      setPanelHeight(Math.max(220, Math.round(bottom - top)));
    };
    syncHeight();
    const frame = window.requestAnimationFrame(syncHeight);
    window.addEventListener("resize", syncHeight);
    const form = rootRef.current?.closest("form");
    const body = rootRef.current?.closest(
      ".acompanamiento-inquiry-sheet__body",
    );
    body?.addEventListener("scroll", syncHeight, { passive: true });
    const ro =
      typeof ResizeObserver !== "undefined" && form
        ? new ResizeObserver(syncHeight)
        : null;
    if (form && ro) ro.observe(form);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", syncHeight);
      body?.removeEventListener("scroll", syncHeight);
      ro?.disconnect();
    };
  }, [open, viewY, viewM0, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (event.target instanceof Node && !el.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cells = useMemo(() => {
    const first = new Date(viewY, viewM0, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(viewY, viewM0 + 1, 0).getDate();
    const out: Array<{ key: string; day: number; disabled: boolean } | null> =
      [];
    for (let i = 0; i < startOffset; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = toKey(viewY, viewM0, d);
      out.push({
        key,
        day: d,
        disabled: key < min || key > max,
      });
    }
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [viewY, viewM0, min, max]);

  const minParsed = useMemo(() => parseKey(min)!, [min]);
  const maxParsed = useMemo(() => parseKey(max)!, [max]);
  const canPrev =
    viewY > minParsed.y || (viewY === minParsed.y && viewM0 > minParsed.m0);
  const canNext =
    viewY < maxParsed.y || (viewY === maxParsed.y && viewM0 < maxParsed.m0);

  const shiftMonth = (delta: number) => {
    const d = new Date(viewY, viewM0 + delta, 1);
    setViewY(d.getFullYear());
    setViewM0(d.getMonth());
  };

  const toggleDay = (key: string) => {
    if (key < min || key > max) return;
    const sorted = [...selected].sort();
    if (!sorted.length) {
      onChange([key]);
      return;
    }
    const rangeStart = sorted[0]!;
    const rangeEnd = sorted[sorted.length - 1]!;

    // Solo extremos se pueden quitar (así no quedan huecos).
    if (selected.has(key)) {
      if (key === rangeStart && key === rangeEnd) {
        onChange([]);
        return;
      }
      if (key === rangeStart) {
        onChange(sorted.slice(1));
        return;
      }
      if (key === rangeEnd) {
        onChange(sorted.slice(0, -1));
        return;
      }
      return;
    }

    // Ampliar siempre en bloque continuo (rellena días intermedios).
    const nextStart = key < rangeStart ? key : rangeStart;
    const nextEnd = key > rangeEnd ? key : rangeEnd;
    onChange(
      keysBetween(nextStart, nextEnd).filter((k) => k >= min && k <= max),
    );
  };

  return (
    <div
      ref={rootRef}
      className={
        "acompanamiento-inquiry-sheet__field acompanamiento-inquiry-sheet__field--date" +
        (open ? " is-open" : "")
      }
    >
      <button
        id={id}
        type="button"
        className={
          "acompanamiento-inquiry-sheet__date-trigger" +
          (selected.size ? " is-filled" : "")
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label="Fechas del evento"
        aria-required={required ? true : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {formatTriggerLabel([...selected])}
      </button>

      {open ? (
        <div
          ref={calendarRef}
          id={listboxId}
          className="acompanamiento-date"
          role="dialog"
          aria-label="Elegir fechas del evento"
          style={panelHeight != null ? { height: panelHeight } : undefined}
        >
          <div className="acompanamiento-date__nav">
            <button
              type="button"
              className="acompanamiento-date__nav-btn"
              aria-label="Mes anterior"
              disabled={!canPrev}
              onClick={() => shiftMonth(-1)}
            >
              ‹
            </button>
            <p className="acompanamiento-date__month">
              {MONTHS[viewM0]} {viewY}
            </p>
            <button
              type="button"
              className="acompanamiento-date__nav-btn"
              aria-label="Mes siguiente"
              disabled={!canNext}
              onClick={() => shiftMonth(1)}
            >
              ›
            </button>
          </div>
          <p className="acompanamiento-date__hint">
            Varias fechas seguidas
          </p>
          <div className="acompanamiento-date__weekdays" aria-hidden={true}>
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="acompanamiento-date__grid">
            {cells.map((cell, index) =>
              cell ? (
                <button
                  key={cell.key}
                  type="button"
                  className={
                    "acompanamiento-date__day" +
                    (selected.has(cell.key) ? " is-selected" : "") +
                    (cell.key === min ? " is-today" : "")
                  }
                  disabled={cell.disabled}
                  aria-pressed={selected.has(cell.key)}
                  onClick={() => {
                    if (cell.disabled) return;
                    toggleDay(cell.key);
                  }}
                >
                  {cell.day}
                </button>
              ) : (
                <span
                  key={`e-${index}`}
                  className="acompanamiento-date__day acompanamiento-date__day--empty"
                />
              ),
            )}
          </div>
          <button
            type="button"
            className="acompanamiento-date__ok"
            onClick={() => setOpen(false)}
          >
            Ok
          </button>
        </div>
      ) : null}
    </div>
  );
}
