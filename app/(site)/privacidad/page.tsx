import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal-document";
import { getLegalDocument } from "@/lib/legal/get-legal-document";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Política de privacidad y protección de datos de Maison Vigo conforme al RGPD y la LOPDGDD.",
};

export default function PrivacidadPage() {
  return (
    <LegalDocument
      title="Política de Privacidad"
      markdown={getLegalDocument("politica-privacidad")}
    />
  );
}
