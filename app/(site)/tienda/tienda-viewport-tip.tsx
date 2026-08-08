"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  label: string;
  children: ReactNode;
  className?: string;
};

type Pos = {
  top: number;
  left: number;
  width: number;
  placement: "above" | "below";
  arrowLeft: number;
};

/**
 * Tip ? con burbuja en portal fixed, anclada al botón y
 * reclampada al viewport (no se sale de pantalla ni del sheet).
 */
export function TiendaViewportTip({ label, children, className }: Props) {
  const tipId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const updatePos = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = Math.min(260, window.innerWidth - 24);
    const gap = 10;
    const measured = bubbleRef.current?.offsetHeight ?? 0;
    const height = measured > 0 ? measured : 96;

    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12));

    const spaceAbove = rect.top - 12;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const placement: "above" | "below" =
      spaceAbove >= height + gap || spaceAbove >= spaceBelow ? "above" : "below";

    let top =
      placement === "above" ? rect.top - height - gap : rect.bottom + gap;
    top = Math.max(12, Math.min(top, window.innerHeight - Math.min(height, 80) - 12));

    const arrowLeft = Math.min(
      width - 16,
      Math.max(16, rect.left + rect.width / 2 - left),
    );

    setPos({ top, left, width, placement, arrowLeft });
  };

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    updatePos();
    const frame = window.requestAnimationFrame(() => updatePos());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMove = () => updatePos();
    window.addEventListener("resize", onMove);
    document.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      document.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (btnRef.current?.contains(target)) return;
      if (bubbleRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
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

  const bubble =
    portalReady && open && pos
      ? createPortal(
          <span
            ref={bubbleRef}
            id={tipId}
            role="tooltip"
            className={
              "tienda-viewport-tip__bubble" +
              (pos.placement === "below"
                ? " tienda-viewport-tip__bubble--below"
                : "")
            }
            style={
              {
                top: pos.top,
                left: pos.left,
                width: pos.width,
                ["--tip-arrow-left"]: `${pos.arrowLeft}px`,
              } as CSSProperties
            }
          >
            {children}
          </span>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={
          "tienda-field-tip tienda-viewport-tip" +
          (open ? " is-open" : "") +
          (className ? ` ${className}` : "")
        }
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => {
          if (window.matchMedia("(hover: hover)").matches) setOpen(true);
        }}
        onMouseLeave={() => {
          if (window.matchMedia("(hover: hover)").matches) setOpen(false);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay so tap inside bubble (if any) isn't needed; bubble is not focusable.
          window.setTimeout(() => {
            if (document.activeElement !== btnRef.current) setOpen(false);
          }, 0);
        }}
      >
        <span aria-hidden={true}>?</span>
      </button>
      {bubble}
    </>
  );
}
