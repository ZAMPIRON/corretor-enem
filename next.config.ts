import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Garante que o banco de questões vá junto com as rotas do servidor na Vercel.
  outputFileTracingIncludes: {
    "/api/**": ["./data/questoes/**"],
    "/simulado": ["./data/questoes/**"],
  },
};

export default nextConfig;
