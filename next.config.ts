import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Em `npm run dev`, o Next bloqueia o JavaScript para quem abre pelo IP da rede (ex.: no celular),
  // e a página fica sem reagir a cliques. Libera a rede local; não afeta a produção.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local"],
  // Garante que o banco de questões vá junto com as rotas do servidor na Vercel.
  outputFileTracingIncludes: {
    "/api/**": ["./data/questoes/**"],
    "/simulado": ["./data/questoes/**"],
  },
};

export default nextConfig;
