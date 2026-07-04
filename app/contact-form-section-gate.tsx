"use client";

import { usePathname } from "next/navigation";

import { ContactFormSection } from "./contact-form-section";

/** Desactivar para ocultar el formulario sin quitar el componente. */
const CONTACT_FORM_ENABLED = false;

export function ContactFormSectionGate() {
  const pathname = usePathname();

  if (!CONTACT_FORM_ENABLED) {
    return null;
  }

  if (pathname === "/mvcare" || pathname.startsWith("/mvcare/")) {
    return null;
  }

  return <ContactFormSection />;
}
