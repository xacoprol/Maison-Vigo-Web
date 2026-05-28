import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * `next/image` v16 obliga a declarar cada `quality` que usamos.
     * 70 (capas pesadas detrás de UI), 75 (mayoría), 82 (hero servicios), 88 (legacy).
     */
    qualities: [70, 75, 82, 88],
  },
};

export default nextConfig;
