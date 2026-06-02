"use client";

import { useSearchParams } from "next/navigation";

export function MaintenanceClient() {
  const searchParams = useSearchParams();
  const hasError = searchParams.get("error") === "1";

  return (
    <main className="maintenance-page">
      <video
        className="maintenance-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/maison-vigo.mp4" type="video/mp4" />
      </video>
      <div className="maintenance-overlay" />

      <section className="maintenance-card">
        <img
          src="/maison-vigo-b.svg"
          alt="Maison Vigo"
          width={320}
          height={120}
          className="maintenance-logo"
        />

        <p className="maintenance-copy">Una pausa con calma. Volvemos pronto.</p>

        <form className="maintenance-form" method="post" action="/api/maintenance-login">
          <label htmlFor="maintenancePassword" className="maintenance-label">
            Acceso privado
          </label>
          <input
            id="maintenancePassword"
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
