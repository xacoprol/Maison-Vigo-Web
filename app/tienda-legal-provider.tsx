"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  TiendaLegalSheet,
  type TiendaLegalDoc,
} from "./tienda-legal-sheet";

export type TiendaLegalDocKey = "privacidad" | "cookies" | "condiciones";

export type TiendaLegalDocs = Record<TiendaLegalDocKey, TiendaLegalDoc>;

type TiendaLegalContextValue = {
  openLegal: (key: TiendaLegalDocKey) => void;
  closeLegal: () => void;
};

const TiendaLegalContext = createContext<TiendaLegalContextValue | null>(null);

export function useTiendaLegal() {
  return useContext(TiendaLegalContext);
}

export function TiendaLegalProvider({
  docs,
  children,
}: {
  docs: TiendaLegalDocs;
  children: ReactNode;
}) {
  const [key, setKey] = useState<TiendaLegalDocKey | null>(null);

  const openLegal = useCallback((next: TiendaLegalDocKey) => {
    setKey(next);
  }, []);

  const closeLegal = useCallback(() => {
    setKey(null);
  }, []);

  const value = useMemo(
    () => ({ openLegal, closeLegal }),
    [openLegal, closeLegal],
  );

  return (
    <TiendaLegalContext.Provider value={value}>
      {children}
      <TiendaLegalSheet
        doc={key ? docs[key] : null}
        open={Boolean(key)}
        onClose={closeLegal}
      />
    </TiendaLegalContext.Provider>
  );
}
