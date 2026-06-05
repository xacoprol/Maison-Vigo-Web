import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal-document";
import { getLegalDocument } from "@/lib/legal/get-legal-document";

export const metadata: Metadata = {
  title: "Política de reservas y cancelaciones",
  description:
    "Condiciones de reserva de servicios de peluquería canina y cuidado en Maison Vigo.",
};

export default function PoliticaReservasPage() {
  return (
    <LegalDocument
      title="Política de Reservas y Cancelaciones"
      markdown={getLegalDocument("politica-reservas")}
    />
  );
}
