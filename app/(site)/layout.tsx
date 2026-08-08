import { ContactFormSectionGate } from "../contact-form-section-gate";
import { SeoJsonLd } from "../seo-json-ld";
import { SiteEffects } from "../site-effects";
import { SiteFooter } from "../site-footer";
import { SiteShell } from "../site-shell";
import { TiendaCartFab } from "../tienda-cart-fab";
import { TiendaOrderTrackBanner } from "../tienda-order-track-banner";
import { WebStoreCartProvider } from "./tienda/web-store-cart";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WebStoreCartProvider>
      <SeoJsonLd />
      <SiteEffects />
      <SiteShell />
      {children}
      <ContactFormSectionGate />
      <TiendaOrderTrackBanner />
      <SiteFooter />
      <TiendaCartFab />
    </WebStoreCartProvider>
  );
}
