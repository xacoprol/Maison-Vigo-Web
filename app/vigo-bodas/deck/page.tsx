import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  VIGO_BODAS_ACCESS_COOKIE,
  hasVigoBodasAccess,
} from "@/lib/vigo-bodas-auth";

import { VigoBodasDeckClient } from "./deck-client";

export const metadata: Metadata = {
  title: "Vigo Bodas · Presentación",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const dynamic = "force-dynamic";

export default async function VigoBodasDeckPage() {
  const jar = await cookies();
  if (!hasVigoBodasAccess(jar.get(VIGO_BODAS_ACCESS_COOKIE)?.value)) {
    redirect("/vigo-bodas");
  }

  return <VigoBodasDeckClient />;
}
