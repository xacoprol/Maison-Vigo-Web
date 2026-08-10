"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

export function titleCaseBreedLabel(raw: string): string {
  return String(raw ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(
      (w) =>
        w.charAt(0).toLocaleUpperCase("es-ES") +
        w.slice(1).toLocaleLowerCase("es-ES"),
    )
    .join(" ");
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

type Props = {
  id: string;
  label: string;
  value: string;
  options: string[];
  error?: string;
  onChange: (next: string) => void;
  placeholder?: string;
};

export function AcompanamientoInquiryBreedField({
  id,
  label,
  value,
  options,
  error,
  onChange,
  placeholder = "Raza o tamaño",
}: Props) {
  const uid = useId();
  const listId = `${uid}-list`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [active, setActive] = useState(0);
  const [panelBox, setPanelBox] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = useMemo(() => {
    const q = norm(query);
    const list = !q
      ? options
      : options.filter((o) => norm(o).includes(q));
    return list.slice(0, 80);
  }, [options, query]);

  const exactMatch = useMemo(() => {
    const q = query.trim();
    if (!q) return true;
    return options.some((o) => norm(o) === norm(q));
  }, [options, query]);

  const showAdd = Boolean(query.trim()) && !exactMatch;

  type Row =
    | { kind: "option"; text: string }
    | { kind: "add"; text: string }
    | { kind: "empty" };

  const rows: Row[] = useMemo(() => {
    const r: Row[] = filtered.map((text) => ({ kind: "option" as const, text }));
    if (showAdd) r.push({ kind: "add", text: titleCaseBreedLabel(query) });
    if (!r.length) r.push({ kind: "empty" });
    return r;
  }, [filtered, showAdd, query]);

  useEffect(() => {
    if (!open) return;
    setActive(0);
  }, [open, query, filtered.length, showAdd]);

  useEffect(() => {
    if (!open) {
      setPanelBox(null);
      return;
    }
    const update = () => {
      const el = inputRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 6;
      const pad = 8;
      const spaceBelow = window.innerHeight - r.bottom - gap - pad;
      setPanelBox({
        top: r.bottom + gap,
        left: r.left,
        width: r.width,
        maxHeight: Math.min(240, Math.max(120, spaceBelow)),
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      commitQuery();
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  });

  const commitQuery = (raw = query) => {
    const next = titleCaseBreedLabel(raw);
    setQuery(next);
    onChange(next);
  };

  const pickOption = (text: string) => {
    const next = titleCaseBreedLabel(text);
    setQuery(next);
    onChange(next);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((i) => Math.min(i + 1, rows.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[active];
      if (row?.kind === "option" || row?.kind === "add") {
        pickOption(row.text);
      } else {
        commitQuery();
        setOpen(false);
      }
    }
  };

  return (
    <div
      ref={rootRef}
      className={
        "acompanamiento-inquiry-sheet__field acompanamiento-inquiry-sheet__field--float acompanamiento-inquiry-sheet__field--breed" +
        (error ? " acompanamiento-inquiry-sheet__field--error" : "") +
        (open ? " is-open" : "")
      }
    >
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete="off"
        spellCheck={false}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => {
            if (!panelRef.current?.contains(document.activeElement)) {
              commitQuery();
              setOpen(false);
            }
          }, 120);
        }}
        onKeyDown={onKeyDown}
      />
      <label htmlFor={id}>{label}</label>
      {error ? (
        <p id={`${id}-error`} className="acompanamiento-inquiry-sheet__field-error" role="alert">
          {error}
        </p>
      ) : null}

      {open && panelBox && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              className="acompanamiento-inquiry-sheet__breed-panel"
              style={{
                top: panelBox.top,
                left: panelBox.left,
                width: panelBox.width,
                maxHeight: panelBox.maxHeight,
              }}
            >
              <ul id={listId} role="listbox" aria-label={label}>
                {rows.map((row, idx) => {
                  if (row.kind === "empty") {
                    return (
                      <li
                        key="empty"
                        className="acompanamiento-inquiry-sheet__breed-empty"
                      >
                        Escribe para buscar o añadir
                      </li>
                    );
                  }
                  const selected = idx === active;
                  if (row.kind === "add") {
                    return (
                      <li
                        key="add"
                        role="option"
                        aria-selected={selected}
                        className={
                          "acompanamiento-inquiry-sheet__breed-option acompanamiento-inquiry-sheet__breed-option--add" +
                          (selected ? " is-active" : "")
                        }
                        onMouseEnter={() => setActive(idx)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickOption(row.text)}
                      >
                        Añadir «{row.text}»
                      </li>
                    );
                  }
                  return (
                    <li
                      key={`${row.text}-${idx}`}
                      role="option"
                      aria-selected={norm(row.text) === norm(value) || selected}
                      className={
                        "acompanamiento-inquiry-sheet__breed-option" +
                        (selected ? " is-active" : "") +
                        (norm(row.text) === norm(value) ? " is-value" : "")
                      }
                      onMouseEnter={() => setActive(idx)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickOption(row.text)}
                    >
                      {row.text}
                    </li>
                  );
                })}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
