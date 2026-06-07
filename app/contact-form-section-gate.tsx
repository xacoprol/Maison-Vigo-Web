"use client";

import { usePathname } from "next/navigation";

import { ContactFormSection } from "./contact-form-section";

export function ContactFormSectionGate() {
  const pathname = usePathname();

  if (pathname === "/mvcare" || pathname.startsWith("/mvcare/")) {
    return null;
  }

  return <ContactFormSection />;
}
