import { porIds } from "@/lib/banco.ts";
import { estimarTheta } from "@/lib/tri.ts";
import { AREAS, ESCALA, MINIMO_TRI, type Area } from "@/lib/provas.ts";

export interface ResultadoArea {
  area: Area;
  acertos: number;
  total: number;
  nota: number | null; // null quando há poucas questões com parâmetros TRI
  margem: number | null;
  comTri: number;
}

export interface Resultado {
  areas: ResultadoArea[];
  questoes: { id: string; gabarito: string; marcada: string | null; certa: boolean; anulada: boolean }[];
}

export async function POST(req: Request) {
  const { ids, respostas } = (await req.json()) as { ids: string[]; respostas: Record<string, string> };
  const questoes = porIds(ids ?? []);

  const areas: ResultadoArea[] = [];
  for (const area of AREAS) {
    // Questões anuladas pelo INEP não contam.
    const daArea = questoes.filter((q) => q.area === area && !q.anulada);
    if (daArea.length === 0) continue;
    const acertos = daArea.filter((q) => respostas[q.id] === q.gabarito).length;
    const comTri = daArea.filter((q) => q.tri);
    let nota: number | null = null;
    let margem: number | null = null;
    if (comTri.length >= MINIMO_TRI) {
      const { theta, erroPadrao } = estimarTheta(comTri.map((q) => q.tri!), comTri.map((q) => respostas[q.id] === q.gabarito));
      nota = Math.round(ESCALA[area].media + ESCALA[area].desvio * theta);
      margem = Math.round(ESCALA[area].desvio * erroPadrao);
    }
    areas.push({ area, acertos, total: daArea.length, nota, margem, comTri: comTri.length });
  }

  const resultado: Resultado = {
    areas,
    questoes: questoes.map((q) => ({
      id: q.id,
      gabarito: q.gabarito,
      marcada: respostas[q.id] || null,
      certa: respostas[q.id] === q.gabarito,
      anulada: !!q.anulada,
    })),
  };
  return Response.json(resultado);
}
