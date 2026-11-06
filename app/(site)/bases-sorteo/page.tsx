import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal-document";
import { getLegalDocument } from "@/lib/legal/get-legal-document";

export const metadata: Metadata = {
  title: "Bases del sorteo",
  description:
    "Bases legales del sorteo de Maison Vigo en Instagram.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function BasesSorteoPage() {
  return (
    <LegalDocument
      title="Bases del sorteo"
      markdown={getLegalDocument("bases-sorteo")}
    />
  );
}
