"use client";

import { useEffect, useState } from "react";

import { fetchWebStoreSessionContext } from "@/lib/web-store/api";

type SessionState = {
  loggedIn: boolean;
  petName: string | null;
};

/**
 * Nombre de mascota solo si hay cookie de sesión MV Care
 * (requiere COOKIE_DOMAIN=.maisonvigo.es en Care para compartir con la web).
 */
export function useWebStoreMvCareSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    loggedIn: false,
    petName: null,
  });

  useEffect(() => {
    let cancelled = false;
    void fetchWebStoreSessionContext()
      .then((ctx) => {
        if (cancelled) return;
        const petName = String(ctx.petName ?? "").trim() || null;
        setState({
          loggedIn: Boolean(ctx.loggedIn),
          petName: ctx.loggedIn ? petName : null,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ loggedIn: false, petName: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
