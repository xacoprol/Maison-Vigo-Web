import { ContactFormSectionGate } from "../contact-form-section-gate";
import { SeoJsonLd } from "../seo-json-ld";
import { SiteEffects } from "../site-effects";
import { SiteFooter } from "../site-footer";
import { SiteShell } from "../site-shell";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SeoJsonLd />
      <SiteEffects />
      <SiteShell />
      {children}
      <ContactFormSectionGate />
      <SiteFooter />
    </>
  );
}
