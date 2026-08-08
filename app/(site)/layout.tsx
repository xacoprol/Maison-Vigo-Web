import { ContactFormSectionGate } from "../contact-form-section-gate";
import { SeoJsonLd } from "../seo-json-ld";
import { SiteEffects } from "../site-effects";
import { SiteFooter } from "../site-footer";
import { SiteShell } from "../site-shell";
import { TiendaCartFab } from "../tienda-cart-fab";
import {
  TiendaLegalProvider,
  type TiendaLegalDocs,
} from "../tienda-legal-provider";
import { TiendaOrderTrackBanner } from "../tienda-order-track-banner";
import { getLegalDocument } from "@/lib/legal/get-legal-document";
import { WebStoreCartProvider } from "./tienda/web-store-cart";

const tiendaLegalDocs: TiendaLegalDocs = {
  privacidad: {
    title: "Política de Privacidad",
    markdown: getLegalDocument("politica-privacidad"),
  },
  cookies: {
    title: "Política de Cookies",
    markdown: getLegalDocument("politica-cookies"),
  },
  condiciones: {
    title: "Condiciones Generales de Compra",
    markdown: getLegalDocument("condiciones-generales"),
  },
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WebStoreCartProvider>
      <TiendaLegalProvider docs={tiendaLegalDocs}>
        <SeoJsonLd />
        <SiteEffects />
        <SiteShell />
        {children}
        <ContactFormSectionGate />
        <TiendaOrderTrackBanner />
        <SiteFooter />
        <TiendaCartFab />
      </TiendaLegalProvider>
    </WebStoreCartProvider>
  );
}
