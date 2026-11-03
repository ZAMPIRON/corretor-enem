// Converte o arquivo ITENS_PROVA_<ano>.csv dos microdados do ENEM (INEP) em provas JSON
// na pasta data/provas, uma por caderno (e por língua estrangeira, em Linguagens).
//
// Uso: npm run importar -- caminho/ITENS_PROVA_2023.csv

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { NOME_AREA, type Area, type ItemProva, type Prova } from "../lib/provas.ts";

const arquivo = process.argv[2];
if (!arquivo) {
  console.error("Uso: npm run importar -- caminho/ITENS_PROVA_2023.csv");
  process.exit(1);
}

const ano = Number(path.basename(arquivo).match(/(\d{4})/)?.[1]);
if (!ano) throw new Error("Não achei o ano no nome do arquivo (esperado ITENS_PROVA_<ano>.csv)");

// Os microdados vêm em latin1 com separador ";".
const linhas = readFileSync(arquivo, "latin1").split(/\r?\n/).filter((l) => l.trim());
const limpar = (v: string) => v.trim().replace(/^"|"$/g, "");
const cabecalho = linhas[0].split(";").map(limpar);
const col = (nome: string) => {
  const i = cabecalho.indexOf(nome);
  if (i < 0) throw new Error(`Coluna ${nome} não encontrada`);
  return i;
};
const C = {
  posicao: col("CO_POSICAO"), area: col("SG_AREA"), gabarito: col("TX_GABARITO"),
  a: col("NU_PARAM_A"), b: col("NU_PARAM_B"), c: col("NU_PARAM_C"),
  cor: col("TX_COR"), prova: col("CO_PROVA"), lingua: col("TP_LINGUA"), abandonado: col("IN_ITEM_ABAN"),
};
const num = (v: string) => Number(v.replace(",", "."));

interface Linha { item: ItemProva; area: Area; cor: string; prova: string; lingua: string }
const registros: Linha[] = linhas.slice(1).map((l) => {
  const v = l.split(";").map(limpar);
  const anulado = v[C.abandonado] === "1" || !v[C.a];
  return {
    item: { posicao: Number(v[C.posicao]), gabarito: v[C.gabarito], a: num(v[C.a] || "0"), b: num(v[C.b] || "0"), c: num(v[C.c] || "0"), anulado },
    area: v[C.area] as Area, cor: v[C.cor], prova: v[C.prova], lingua: v[C.lingua],
  };
});

const cadernos = new Map<string, Linha[]>();
for (const r of registros) {
  const lista = cadernos.get(r.prova) ?? [];
  lista.push(r);
  cadernos.set(r.prova, lista);
}

const destino = path.join(process.cwd(), "data", "provas");
mkdirSync(destino, { recursive: true });
let criadas = 0;

for (const [codigo, lista] of cadernos) {
  const { area, cor } = lista[0];
  // Em Linguagens, as questões de inglês (TP_LINGUA 0) e espanhol (1) geram provas separadas.
  const variantes: [string, Linha[]][] = area === "LC"
    ? [["Inglês", lista.filter((r) => r.lingua !== "1")], ["Espanhol", lista.filter((r) => r.lingua !== "0")]]
    : [["", lista]];
  for (const [lingua, itens] of variantes) {
    const sufixo = lingua ? `-${lingua.toLowerCase().slice(0, 3)}` : "";
    const prova: Prova = {
      id: `${ano}-${area}-${codigo}${sufixo}`,
      nome: `ENEM ${ano} ${NOME_AREA[area]}, caderno ${cor} (${codigo})${lingua ? `, ${lingua}` : ""}`,
      ano, area, oficial: true,
      itens: itens.map((r) => r.item).sort((x, y) => x.posicao - y.posicao),
    };
    writeFileSync(path.join(destino, `${prova.id}.json`), JSON.stringify(prova));
    criadas++;
  }
}

console.log(`${criadas} provas criadas em data/provas a partir de ${registros.length} itens.`);
