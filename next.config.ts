import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [new URL("https://image.tmdb.org/t/p/**")],
  },
  // Les dictées vocales (WAV 16 kHz, 45 s max ≈ 1,5 Mo) dépassent la limite par défaut de 1 Mo.
  experimental: {
    serverActions: { bodySizeLimit: "3mb" },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
