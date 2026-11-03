import { provaCompleta, sortear } from "@/lib/banco.ts";
import { AREAS, publica, type Area, type Idioma } from "@/lib/provas.ts";

const MAXIMO = 180;

interface Pedido {
  modo: "sorteio" | "completa";
  areas?: Area[];
  anos?: number[];
  ano?: number;
  area?: Area;
  idioma?: Idioma;
  quantidade?: number;
  soComTri?: boolean;
}

export async function POST(req: Request) {
  const p = (await req.json()) as Pedido;
  const idioma: Idioma = p.idioma === "espanhol" ? "espanhol" : "ingles";

  const questoes = p.modo === "completa"
    ? provaCompleta(Number(p.ano), AREAS.includes(p.area as Area) ? (p.area as Area) : "MT", idioma)
    : sortear({
        areas: (p.areas ?? []).filter((a) => AREAS.includes(a)),
        anos: (p.anos ?? []).map(Number).filter(Boolean),
        idioma,
        quantidade: Math.min(MAXIMO, Math.max(1, Number(p.quantidade) || 10)),
        soComTri: !!p.soComTri,
      });

  if (questoes.length === 0) {
    return Response.json({ erro: "Nenhuma questão encontrada com esses filtros." }, { status: 404 });
  }
  return Response.json({ questoes: questoes.map(publica) });
}
