import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  images: {
    /**
     * `next/image` v16 obliga a declarar cada `quality` que usamos.
     * 70 (capas pesadas detrás de UI), 75 (mayoría), 82 (hero servicios), 88 (legacy).
     */
    qualities: [70, 75, 82, 88],
    /**
     * En local, el optimizador de Turbopack puede quedarse colgado o tardar
     * minutos (caché corrupta en iCloud Drive). Servimos los archivos de
     * `/public` directamente en dev; en producción sigue activo el optimizer.
     */
    unoptimized: isDev,
  },
};

export default nextConfig;
