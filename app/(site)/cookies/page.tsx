import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de cookies",
  description:
    "Información sobre el uso de cookies en el sitio web de Maison Vigo.",
};

export default function CookiesPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "120px 24px 64px",
        maxWidth: 920,
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginBottom: 20 }}>Política de Cookies</h1>
      <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
        Este sitio utiliza cookies para recordar preferencias y mejorar la
        experiencia de navegación.
      </p>
      <p style={{ lineHeight: 1.7 }}>
        Puedes aceptar o rechazar las cookies desde el aviso mostrado en la
        página principal.
      </p>
    </main>
  );
}
