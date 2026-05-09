import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { rootMetadata } from "@/lib/seo-metadata";

import { SeoJsonLd } from "./seo-json-ld";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = rootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <SeoJsonLd />
        {children}
      </body>
    </html>
  );
}
