"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { LegalDocumentBody } from "@/components/legal-document";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

import "./tienda-legal-sheet.css";

const EXIT_MS = 520;

export type TiendaLegalDoc = {
  title: string;
  markdown: string;
};

type Props = {
  doc: TiendaLegalDoc | null;
  open: boolean;
  onClose: () => void;
};

export function TiendaLegalSheet({ doc, open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const grabberRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const [portalReady, setPortalReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeDoc, setActiveDoc] = useState<TiendaLegalDoc | null>(null);

  onCloseRef.current = onClose;

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (open && doc) {
      setActiveDoc(doc);
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
    }

    setVisible(false);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setActiveDoc(null);
    }, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open, doc]);

  useEffect(() => {
    if (!mounted) return;
    lockScroll();
    return () => unlockScroll();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  /* Arrastre nativo (touch + pointer): mismo patrón que la ficha de producto. */
  useEffect(() => {
    if (!mounted || !visible) return;
    const handle = grabberRef.current;
    const panel = panelRef.current;
    if (!handle || !panel) return;

    type DragState = {
      startY: number;
      lastY: number;
      lastTs: number;
      dy: number;
      velocity: number;
      pointerId: number | null;
    };
    let drag: DragState | null = null;

    const backdrop = () =>
      panel.parentElement?.querySelector(".tienda-legal-sheet__backdrop");

    const startDrag = (clientY: number, pointerId: number | null) => {
      drag = {
        startY: clientY,
        lastY: clientY,
        lastTs: performance.now(),
        dy: 0,
        velocity: 0,
        pointerId,
      };
      panel.classList.add("tienda-legal-sheet__panel--dragging");
      panel.style.transition = "none";
    };

    const moveDrag = (clientY: number) => {
      if (!drag) return;
      const now = performance.now();
      const dt = Math.max(1, now - drag.lastTs);
      drag.velocity = (clientY - drag.lastY) / dt;
      drag.lastY = clientY;
      drag.lastTs = now;
      const dy = Math.max(0, clientY - drag.startY);
      drag.dy = dy;
      panel.style.transform = `translate3d(0, ${dy}px, 0)`;
      const bd = backdrop();
      if (bd instanceof HTMLElement) {
        bd.style.opacity = String(Math.max(0.22, 1 - dy / 420));
      }
    };

    const endDrag = () => {
      if (!drag) return;
      const { dy, velocity } = drag;
      drag = null;
      const shouldClose = dy > 96 || (dy > 40 && velocity > 0.35);

      const bd = backdrop();
      if (bd instanceof HTMLElement) bd.style.opacity = "";

      panel.classList.remove("tienda-legal-sheet__panel--dragging");
      panel.style.transition = "";

      if (shouldClose) {
        panel.style.transform = "translate3d(0, 104%, 0)";
        onCloseRef.current();
        return;
      }
      panel.style.transform = "translate3d(0, 0, 0)";
      window.setTimeout(() => {
        if (
          panelRef.current === panel &&
          !panel.classList.contains("tienda-legal-sheet__panel--dragging")
        ) {
          panel.style.transform = "";
        }
      }, EXIT_MS);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      startDrag(event.touches[0]!.clientY, null);
    };
    const onTouchMove = (event: TouchEvent) => {
      if (!drag || event.touches.length !== 1) return;
      event.preventDefault();
      moveDrag(event.touches[0]!.clientY);
    };
    const onTouchEnd = () => endDrag();

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      if (event.button !== 0) return;
      handle.setPointerCapture(event.pointerId);
      startDrag(event.clientY, event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      moveDrag(event.clientY);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (handle.hasPointerCapture(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId);
      }
      endDrag();
    };

    handle.addEventListener("touchstart", onTouchStart, { passive: true });
    handle.addEventListener("touchmove", onTouchMove, { passive: false });
    handle.addEventListener("touchend", onTouchEnd);
    handle.addEventListener("touchcancel", onTouchEnd);
    handle.addEventListener("pointerdown", onPointerDown);
    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", onPointerUp);
    handle.addEventListener("pointercancel", onPointerUp);

    return () => {
      handle.removeEventListener("touchstart", onTouchStart);
      handle.removeEventListener("touchmove", onTouchMove);
      handle.removeEventListener("touchend", onTouchEnd);
      handle.removeEventListener("touchcancel", onTouchEnd);
      handle.removeEventListener("pointerdown", onPointerDown);
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", onPointerUp);
      handle.removeEventListener("pointercancel", onPointerUp);
      drag = null;
    };
  }, [mounted, visible]);

  useEffect(() => {
    if (!visible) {
      const panel = panelRef.current;
      if (panel) {
        panel.style.transform = "";
        panel.style.transition = "";
        panel.classList.remove("tienda-legal-sheet__panel--dragging");
      }
    }
  }, [visible]);

  const close = useCallback(() => onClose(), [onClose]);

  if (!portalReady || !mounted || !activeDoc) return null;

  return createPortal(
    <div
      className={
        "tienda-legal-sheet" + (visible ? " tienda-legal-sheet--visible" : "")
      }
      role="presentation"
    >
      <button
        type="button"
        className="tienda-legal-sheet__backdrop"
        aria-label="Cerrar"
        onClick={close}
      />
      <div
        ref={panelRef}
        className="tienda-legal-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-label={activeDoc.title}
      >
        <header className="tienda-legal-sheet__toolbar">
          <div
            ref={grabberRef}
            className="tienda-legal-sheet__grabber"
            role="button"
            tabIndex={0}
            aria-label="Arrastra hacia abajo para cerrar"
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                close();
              }
            }}
          >
            <span className="tienda-legal-sheet__grabber-bar" aria-hidden={true} />
          </div>
          <p className="tienda-legal-sheet__eyebrow">Documento legal</p>
          <button
            type="button"
            className="tienda-legal-sheet__close"
            aria-label="Cerrar"
            onClick={close}
          >
            ×
          </button>
        </header>
        <div className="tienda-legal-sheet__scroll">
          <LegalDocumentBody
            title={activeDoc.title}
            markdown={activeDoc.markdown}
            headingLevel={2}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
