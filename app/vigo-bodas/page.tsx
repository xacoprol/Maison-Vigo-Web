import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  VIGO_BODAS_ACCESS_COOKIE,
  hasVigoBodasAccess,
} from "@/lib/vigo-bodas-auth";

import { VigoBodasLoginClient } from "./login-client";

export const metadata: Metadata = {
  title: "Vigo Bodas",
  description: "Presentación interna del acompañamiento canino para bodas.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const dynamic = "force-dynamic";

function LoginFallback() {
  return (
    <main className="maintenance-page">
      <div className="maintenance-overlay" />
      <section className="maintenance-card">
        <p className="maintenance-copy">Vigo Bodas · Acceso stand</p>
      </section>
    </main>
  );
}

export default async function VigoBodasPage() {
  const jar = await cookies();
  if (hasVigoBodasAccess(jar.get(VIGO_BODAS_ACCESS_COOKIE)?.value)) {
    redirect("/vigo-bodas/deck");
  }

  return (
    <Suspense fallback={<LoginFallback />}>
      <VigoBodasLoginClient />
    </Suspense>
  );
}
