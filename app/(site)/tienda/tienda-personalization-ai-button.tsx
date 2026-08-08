"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { postWebStorePersonalizationTextDraft } from "@/lib/web-store/api";
import { buildPersonalizationTextOptions } from "@/lib/web-store/personalization-text-draft";

type Props = {
  productName: string;
  fieldLabel: string;
  maxLength?: number | null;
  currentValue?: string;
  otherTexts?: string[];
  petName?: string | null;
  disabled?: boolean;
  onGenerated: (text: string) => void;
};

type PanelPos = { top: number; left: number; width: number };

export function TiendaPersonalizationAiButton({
  productName,
  fieldLabel,
  maxLength,
  currentValue,
  otherTexts,
  petName,
  disabled,
  onGenerated,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [salt, setSalt] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [pos, setPos] = useState<PanelPos | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const updatePos = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = Math.min(280, window.innerWidth - 24);
    let left = rect.right - width;
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
    let top = rect.bottom + 8;
    const estimatedHeight = 180;
    if (top + estimatedHeight > window.innerHeight - 12) {
      top = Math.max(12, rect.top - estimatedHeight - 8);
    }
    setPos({ top, left, width });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePos();
    window.addEventListener("resize", onScrollOrResize);
    // Capture scroll from sheet panel too.
    document.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    // Defer so the opening click/tap does not immediately close the panel.
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", onPointer);
      document.addEventListener("touchstart", onPointer, { passive: true });
    }, 0);
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const loadOptions = (nextSalt: number) => {
    setSalt(nextSalt);
    setLoading(true);
    setSelected(null);

    const local = buildPersonalizationTextOptions({
      productName,
      fieldLabel,
      maxLength: maxLength ?? null,
      petName: petName ?? null,
      otherTexts: otherTexts ?? [],
      currentValue: currentValue ?? "",
      salt: nextSalt,
      count: 8,
    });
    setOptions(local);
    updatePos();
    setOpen(true);

    void postWebStorePersonalizationTextDraft({
      productName,
      fieldLabel,
      maxLength: maxLength ?? null,
      petName: petName ?? null,
      otherTexts: otherTexts ?? [],
      currentValue: currentValue ?? "",
      salt: nextSalt,
    })
      .then((res) => {
        const fromApi = Array.isArray(res.texts)
          ? res.texts.map((t) => String(t ?? "").trim()).filter(Boolean)
          : [];
        const single = String(res.text ?? "").trim();
        const merged = [...fromApi];
        if (single && !merged.some((t) => t.toLowerCase() === single.toLowerCase())) {
          merged.unshift(single);
        }
        if (merged.length) {
          const seen = new Set<string>();
          const next: string[] = [];
          for (const item of [...merged, ...local]) {
            const key = item.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            next.push(item);
            if (next.length >= 8) break;
          }
          setOptions(next);
        }
      })
      .catch(() => {
        /* local ya visible */
      })
      .finally(() => setLoading(false));
  };

  const panel =
    portalReady && open && options.length > 0 && pos
      ? createPortal(
          <div
            ref={panelRef}
            id={listId}
            className="tienda-ai-panel"
            role="listbox"
            aria-label="Ideas de texto"
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
            }}
          >
            <p className="tienda-ai-panel__hint">Elige una idea:</p>
            <div className="tienda-ai-panel__options">
              {options.map((text) => {
                const isActive = selected === text || currentValue === text;
                return (
                  <button
                    key={text}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={
                      "tienda-ai-chip" + (isActive ? " is-selected" : "")
                    }
                    disabled={disabled}
                    onClick={() => {
                      setSelected(text);
                      onGenerated(text);
                      setOpen(false);
                    }}
                  >
                    {text}
                  </button>
                );
              })}
            </div>
            <div className="tienda-ai-panel__footer">
              <button
                type="button"
                className="tienda-ai-panel__more"
                disabled={disabled || loading}
                onClick={() => loadOptions(salt + 1)}
              >
                {loading ? "…" : "Más ideas"}
              </button>
              <button
                type="button"
                className="tienda-ai-panel__close"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={"tienda-ai" + (open ? " is-open" : "")}>
      <button
        ref={btnRef}
        type="button"
        className="tienda-ai-btn"
        disabled={disabled || loading}
        aria-busy={loading}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        onClick={() => loadOptions(salt + 1)}
      >
        {loading ? "…" : "Inspírame"}
      </button>
      {panel}
    </div>
  );
}
