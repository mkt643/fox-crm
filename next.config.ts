import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Cache Components força anotar manualmente toda rota dinâmica; como o
  // app inteiro é autenticado por usuário (cookies/Supabase), desligamos.
  experimental: {
    serverActions: {
      // Padrão é 1MB, pequeno demais para upload de fotos/carrosséis reais.
      bodySizeLimit: "50mb",
    },
  },
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
