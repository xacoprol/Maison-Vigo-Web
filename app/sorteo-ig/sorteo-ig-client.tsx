"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics";

import "./sorteo-ig.css";

const INSTAGRAM_URL = "https://www.instagram.com/maisonvigo";
const BASES_URL = "/bases-sorteo";
const MAX_WAIT_MS = 1500;

function readUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ]) {
    const value = params.get(key)?.trim();
    if (value) out[key] = value;
  }
  return out;
}

export function SorteoIgClient() {
  useEffect(() => {
    let redirected = false;
    const go = () => {
      if (redirected) return;
      redirected = true;
      window.location.replace(INSTAGRAM_URL);
    };

    const maxWait = window.setTimeout(go, MAX_WAIT_MS);
    const utm = readUtmParams();

    trackEvent(
      "sorteo_qr_scan",
      {
        ...utm,
        destination: "instagram_maisonvigo",
      },
      {
        transport_type: "beacon",
        event_callback: () => {
          window.clearTimeout(maxWait);
          go();
        },
      },
    );

    return () => {
      window.clearTimeout(maxWait);
    };
  }, []);

  return (
    <main className="sorteo-ig">
      <div className="sorteo-ig__inner">
        <img
          className="sorteo-ig__logo"
          src="/maison-vigo-b.svg"
          alt="Maison Vigo"
          width={240}
          height={171}
        />
        <h1 className="sorteo-ig__title">Sorteo en Instagram</h1>
        <p className="sorteo-ig__copy">
          Te estamos llevando al perfil de Maison Vigo. Si no ocurre en un
          momento, usa el enlace.
        </p>
        <a
          className="sorteo-ig__link"
          href={INSTAGRAM_URL}
          rel="noopener noreferrer"
        >
          Ir a @maisonvigo en Instagram
        </a>
        <a
          className="sorteo-ig__bases"
          href={BASES_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Bases legales del sorteo
        </a>
      </div>
    </main>
  );
}
