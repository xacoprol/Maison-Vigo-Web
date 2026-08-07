"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { LegalDocumentBody } from "@/components/legal-document";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

const EXIT_MS = 320;

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
  const titleId = useId();
  const [portalReady, setPortalReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeDoc, setActiveDoc] = useState<TiendaLegalDoc | null>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (open && doc) {
      setActiveDoc(doc);
      setMounted(true);
      const raf = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(raf);
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

  if (!portalReady || !mounted || !activeDoc) return null;

  return createPortal(
    <div
      className={
        "tienda-legal-sheet" + (visible ? " tienda-legal-sheet--visible" : "")
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="tienda-legal-sheet__backdrop"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="tienda-legal-sheet__panel">
        <div className="tienda-legal-sheet__toolbar">
          <p id={titleId} className="tienda-legal-sheet__eyebrow">
            Documento legal
          </p>
          <button
            type="button"
            className="tienda-legal-sheet__close"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
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
