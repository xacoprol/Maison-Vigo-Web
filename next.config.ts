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
   * Canonical = www.maisonvigo.es — evita duplicado apex ↔ www.
   * (También conviene el redirect en el DNS/hosting; esto cubre el edge de Next.)
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "maisonvigo.es" }],
        destination: "https://www.maisonvigo.es/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
