// Baixa todas as questões do ENEM da API pública enem.dev (https://enem.dev)
// e salva um arquivo por ano em data/questoes/<ano>.json.
//
// Uso: npm run baixar            (todos os anos)
//      npm run baixar -- 2022 2023   (só alguns anos)
//
// Rodar de novo atualiza os arquivos, mas mantém os parâmetros TRI já importados.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { corrigirAreas, type Area, type Idioma, type Questao } from "../lib/provas.ts";

const API = process.env.ENEM_API ?? "https://api.enem.dev/v1";
const INTERVALO_MS = 1100; // a API limita a cerca de 1 pedido por segundo
const PAGINA = 50;

const AREA_DA_API: Record<string, Area> = {
  linguagens: "LC",
  "ciencias-humanas": "CH",
  "ciencias-natureza": "CN",
  matematica: "MT",
};
const IDIOMAS: Idioma[] = ["ingles", "espanhol"];
const LETRAS = ["A", "B", "C", "D", "E"];

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
let ultimo = 0;

async function pedir<T>(caminho: string): Promise<T> {
  for (let tentativa = 1; ; tentativa++) {
    const falta = ultimo + INTERVALO_MS - Date.now();
    if (falta > 0) await esperar(falta);
    ultimo = Date.now();
    const r = await fetch(API + caminho, { headers: { accept: "application/json", "user-agent": "corretor-enem" } });
    if (r.status === 429 && tentativa < 5) {
      await esperar(Math.min(Number(r.headers.get("x-ratelimit-reset")) || 10_000, 30_000));
      continue;
    }
    if (!r.ok) throw new Error(`${caminho}: erro ${r.status}`);
    return (await r.json()) as T;
  }
}

interface QuestaoApi {
  index: number;
  year: number;
  discipline: string;
  language: string | null;
  context: string | null;
  files?: string[];
  alternativesIntroduction: string | null;
  correctAlternative: string;
  alternatives: { letter: string; text: string | null; file: string | null }[];
}

function converter(q: QuestaoApi): Questao | null {
  const area = AREA_DA_API[q.discipline];
  if (!area || !LETRAS.includes(q.correctAlternative) || !q.alternatives?.length) return null;
  const idioma = IDIOMAS.find((i) => i === q.language) ?? null;
  const alternativas = q.alternatives.map((a) => ({ letra: a.letter, texto: a.text ?? null, imagem: a.file ?? null }));
  const quebrada = (s: string | null) => (s ?? "").includes("broken-image");
  return {
    id: `${q.year}-${q.index}-${idioma ?? "pt"}`,
    ano: q.year,
    numero: q.index,
    area,
    idioma,
    contexto: q.context ?? null,
    enunciado: q.alternativesIntroduction ?? null,
    alternativas,
    gabarito: q.correctAlternative,
    incompleta: quebrada(q.context) || (q.files ?? []).some(quebrada) || alternativas.some((a) => quebrada(a.imagem) || (!a.texto && !a.imagem)),
  };
}

async function baixarAno(ano: number, idiomas: string[]): Promise<Questao[]> {
  const porId = new Map<string, Questao>();
  const juntar = (lista: QuestaoApi[]) => {
    let novas = 0;
    for (const bruta of lista) {
      const q = converter(bruta);
      if (q && !porId.has(q.id)) {
        porId.set(q.id, q);
        novas++;
      }
    }
    return novas;
  };
  // O offset da API é o número da questão.
  for (let offset = 0; offset < 400; offset += PAGINA) {
    const r = await pedir<{ metadata: { hasMore: boolean }; questions: QuestaoApi[] }>(`/exams/${ano}/questions?limit=${PAGINA}&offset=${offset}`);
    if (juntar(r.questions) === 0 || !r.metadata?.hasMore) break;
  }
  // Sem o parâmetro language a API devolve só um idioma; os outros vêm à parte.
  const estrangeiras = [...porId.values()].filter((q) => q.idioma);
  if (estrangeiras.length) {
    const numeros = estrangeiras.map((q) => q.numero);
    const inicio = Math.min(...numeros);
    const tamanho = Math.max(...numeros) - inicio + 1;
    for (const idioma of idiomas) {
      if (estrangeiras.some((q) => q.idioma === idioma)) continue;
      const r = await pedir<{ questions: QuestaoApi[] }>(`/exams/${ano}/questions?limit=${tamanho}&offset=${inicio}&language=${idioma}`);
      juntar(r.questions.filter((q) => q.language === idioma));
    }
  }
  corrigirAreas([...porId.values()]);
  return [...porId.values()].sort((x, y) => x.numero - y.numero || (x.idioma ?? "").localeCompare(y.idioma ?? ""));
}

const pasta = path.join(process.cwd(), "data", "questoes");
mkdirSync(pasta, { recursive: true });

const provas = await pedir<{ year: number; languages?: { value: string }[] }[]>("/exams");
const pedidos = process.argv.slice(2).map(Number).filter(Boolean);
const anos = provas.filter((p) => pedidos.length === 0 || pedidos.includes(p.year)).sort((x, y) => x.year - y.year);

let total = 0;
for (const prova of anos) {
  const arquivo = path.join(pasta, `${prova.year}.json`);
  const anteriores = existsSync(arquivo) ? (JSON.parse(readFileSync(arquivo, "utf8")) as Questao[]) : [];
  // Preserva o que o importador gravou, inclusive a área corrigida pelos microdados.
  const tri = new Map(anteriores.map((q) => [q.id, { tri: q.tri, anulada: q.anulada, area: q.area }]));
  const questoes = (await baixarAno(prova.year, (prova.languages ?? []).map((l) => l.value))).map((q) => ({ ...q, ...tri.get(q.id) }));
  writeFileSync(arquivo, JSON.stringify(questoes));
  total += questoes.length;
  console.log(`${prova.year}: ${questoes.length} questões (${questoes.filter((q) => q.incompleta).length} incompletas)`);
}
console.log(`Pronto: ${total} questões em data/questoes.`);
