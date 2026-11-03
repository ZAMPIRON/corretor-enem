import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Prova } from "./provas.ts";

const PASTA = path.join(process.cwd(), "data", "provas");

export function carregarProvas(): Prova[] {
  return readdirSync(PASTA)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(path.join(PASTA, f), "utf8")) as Prova)
    .sort((x, y) => Number(y.oficial) - Number(x.oficial) || y.ano - x.ano || x.nome.localeCompare(y.nome));
}
