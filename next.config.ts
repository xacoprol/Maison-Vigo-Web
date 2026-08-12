import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  experimental: {
    /** Evita el error «Failed to open database» de Turbopack en iCloud. */
    turbopackFileSystemCacheForDev: false,
  },
  images: {
    /**
     * `next/image` v16 obliga a declarar cada `quality` que usemos.
     * 70 (capas pesadas detrás de UI), 75 (mayoría), 82 (hero servicios), 88 (legacy).
     */
    qualities: [70, 75, 82, 88],
    /**
     * En local servimos `/public` directamente (unoptimized). En producción
     * sigue activo el optimizer de Next.
     */
    unoptimized: isDev,
  },
  /**
   * Canonical = maisonvigo.es (sin www) — evita duplicado www ↔ apex.
   * En Vercel conviene fijar también el dominio primario sin www.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.maisonvigo.es" }],
        destination: "https://maisonvigo.es/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
