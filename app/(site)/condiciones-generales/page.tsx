import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal-document";
import { getLegalDocument } from "@/lib/legal/get-legal-document";

export const metadata: Metadata = {
  title: "Condiciones generales de compra",
  description:
    "Condiciones de compra online de productos Maison Vigo: pagos, envíos, desistimiento y garantías.",
};

export default function CondicionesGeneralesPage() {
  return (
    <LegalDocument
      title="Condiciones Generales de Compra"
      markdown={getLegalDocument("condiciones-generales")}
    />
  );
}
