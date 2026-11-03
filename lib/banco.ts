// Banco de questões lido dos arquivos em data/questoes (só no servidor).

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Area, Idioma, Questao } from "./provas.ts";

const PASTA = path.join(process.cwd(), "data", "questoes");

let cache: Questao[] | null = null;

export function banco(): Questao[] {
  if (cache) return cache;
  const arquivos = readdirSync(PASTA).filter((f) => f.endsWith(".json"));
  const todas = arquivos.flatMap((f) => JSON.parse(readFileSync(path.join(PASTA, f), "utf8")) as Questao[]);
  // Se o banco real já foi baixado, as questões de exemplo saem.
  const reais = todas.filter((q) => !q.exemplo);
  cache = reais.length > 0 ? reais : todas;
  return cache;
}

export function porIds(ids: string[]): Questao[] {
  const mapa = new Map(banco().map((q) => [q.id, q]));
  return ids.map((id) => mapa.get(id)).filter((q): q is Questao => !!q);
}

export interface Filtro {
  areas: Area[];
  anos: number[]; // vazio = todos
  idioma: Idioma;
  quantidade: number;
  soComTri: boolean;
}

export function utilizavel(q: Questao, idioma: Idioma): boolean {
  return !q.incompleta && !q.anulada && (q.idioma === null || q.idioma === idioma);
}

function embaralhar<T>(lista: T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Sorteia questões dividindo a quantidade igualmente entre as áreas escolhidas.
export function sortear(f: Filtro): Questao[] {
  const candidatas = banco().filter((q) =>
    f.areas.includes(q.area) &&
    (f.anos.length === 0 || f.anos.includes(q.ano)) &&
    utilizavel(q, f.idioma) &&
    (!f.soComTri || !!q.tri));
  const escolhidas: Questao[] = [];
  f.areas.forEach((area, i) => {
    const cota = Math.floor(f.quantidade / f.areas.length) + (i < f.quantidade % f.areas.length ? 1 : 0);
    escolhidas.push(...embaralhar(candidatas.filter((q) => q.area === area)).slice(0, cota));
  });
  // Mantém a ordem do ENEM: por área e, dentro dela, da mais fácil para a mais difícil quando houver TRI.
  return escolhidas.sort((x, y) => f.areas.indexOf(x.area) - f.areas.indexOf(y.area) || (x.tri?.b ?? 0) - (y.tri?.b ?? 0));
}

// Prova completa de uma área num ano, na ordem original.
export function provaCompleta(ano: number, area: Area, idioma: Idioma): Questao[] {
  return banco()
    .filter((q) => q.ano === ano && q.area === area && (q.idioma === null || q.idioma === idioma))
    .sort((x, y) => x.numero - y.numero);
}

export interface Resumo {
  total: number;
  comTri: number;
  anos: { ano: number; total: number; comTri: number; areas: Area[] }[];
  exemplo: boolean;
}

export function resumo(): Resumo {
  const b = banco();
  const anos = new Map<number, { total: number; comTri: number; areas: Set<Area> }>();
  for (const q of b) {
    const r = anos.get(q.ano) ?? { total: 0, comTri: 0, areas: new Set<Area>() };
    r.total++;
    if (q.tri) r.comTri++;
    r.areas.add(q.area);
    anos.set(q.ano, r);
  }
  return {
    total: b.length,
    comTri: b.filter((q) => q.tri).length,
    anos: [...anos].sort((x, y) => y[0] - x[0]).map(([ano, r]) => ({ ano, total: r.total, comTri: r.comTri, areas: [...r.areas] })),
    exemplo: b.some((q) => q.exemplo),
  };
}
