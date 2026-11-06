"use client";

import { useSearchParams } from "next/navigation";

export function VigoBodasLoginClient() {
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error") === "1";

  return (
    <main className="maintenance-page">
      <div className="maintenance-overlay" />
      <section className="maintenance-card">
        <img
          src="/maison-vigo-b.svg"
          alt="Maison Vigo"
          width={320}
          height={120}
          className="maintenance-logo"
        />
        <p className="maintenance-copy">Vigo Bodas · Acceso stand</p>
        <form
          className="maintenance-form"
          method="post"
          action="/api/vigo-bodas-login"
        >
          <label htmlFor="vigoBodasPassword" className="maintenance-label">
            Contraseña del equipo
          </label>
          <input
            id="vigoBodasPassword"
            name="password"
            type="password"
            className="maintenance-input"
            placeholder="Introduce contraseña"
            autoComplete="current-password"
            required
          />
          <button type="submit" className="maintenance-submit">
            Entrar
          </button>
        </form>
        {hasError ? (
          <p className="maintenance-error">Contraseña incorrecta.</p>
        ) : null}
      </section>
    </main>
  );
}
