import { getLegalDocument } from "@/lib/legal/get-legal-document";

import TiendaCheckoutClient from "./checkout-client";

export default function TiendaCheckoutPage() {
  return (
    <TiendaCheckoutClient
      legalDocs={{
        condiciones: {
          title: "Condiciones Generales de Compra",
          markdown: getLegalDocument("condiciones-generales"),
        },
        privacidad: {
          title: "Política de Privacidad",
          markdown: getLegalDocument("politica-privacidad"),
        },
      }}
    />
  );
}
