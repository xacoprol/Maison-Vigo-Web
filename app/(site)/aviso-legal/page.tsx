import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal-document";
import { getLegalDocument } from "@/lib/legal/get-legal-document";

export const metadata: Metadata = {
  title: "Aviso legal",
  description:
    "Información legal del sitio web de Maison Vigo conforme a la LSSI-CE.",
};

export default function AvisoLegalPage() {
  return (
    <LegalDocument
      title="Aviso Legal"
      markdown={getLegalDocument("aviso-legal")}
    />
  );
}
