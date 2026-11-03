import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Corretor ENEM",
  description: "Simulados com nota TRI e correção de redação no modelo do ENEM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header>
          <nav>
            <Link href="/">Corretor ENEM</Link>
            <Link href="/simulado">Simulado TRI</Link>
            <Link href="/redacao">Redação</Link>
            <Link href="/historico">Histórico</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
