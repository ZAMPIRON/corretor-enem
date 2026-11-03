// Junta os parâmetros TRI oficiais do INEP às questões já baixadas em data/questoes.
//
// O arquivo vem dos microdados do ENEM: DADOS/ITENS_PROVA_<ano>.csv
// (https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/enem).
//
// Uso: npm run importar -- caminho/ITENS_PROVA_2023.csv [outros anos...]
//
// A numeração das questões do banco segue um único caderno (uma cor). Para achar qual,
// o script compara a sequência de gabaritos de cada área com a de cada caderno do INEP
// e usa o caderno que mais bate.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { AREAS, corrigirAreas, type Area, type Questao } from "../lib/provas.ts";

interface ItemInep { posicao: number; gabarito: string; a: number; b: number; c: number; anulado: boolean; idioma: string | null }

const MINIMO_CONCORDANCIA = 0.8;
const arquivos = process.argv.slice(2);
if (arquivos.length === 0) {
  console.error("Uso: npm run importar -- caminho/ITENS_PROVA_2023.csv");
  process.exit(1);
}

function lerCsv(arquivo: string): Map<string, { area: Area; cor: string; itens: ItemInep[] }> {
  // Os microdados vêm em latin1 com separador ";".
  const linhas = readFileSync(arquivo, "latin1").split(/\r?\n/).filter((l) => l.trim());
  const limpar = (v: string) => v.trim().replace(/^"|"$/g, "");
  const cab = linhas[0].split(";").map(limpar);
  const col = (nome: string) => {
    const i = cab.indexOf(nome);
    if (i < 0) throw new Error(`Coluna ${nome} não encontrada em ${arquivo}`);
    return i;
  };
  const C = {
    posicao: col("CO_POSICAO"), area: col("SG_AREA"), gabarito: col("TX_GABARITO"),
    a: col("NU_PARAM_A"), b: col("NU_PARAM_B"), c: col("NU_PARAM_C"),
    cor: col("TX_COR"), prova: col("CO_PROVA"), aban: col("IN_ITEM_ABAN"),
    // 2009 não tem língua estrangeira, e o arquivo vem sem essa coluna.
    lingua: cab.indexOf("TP_LINGUA"),
  };
  const num = (v: string) => Number(v.replace(",", "."));
  const cadernos = new Map<string, { area: Area; cor: string; itens: ItemInep[] }>();
  for (const l of linhas.slice(1)) {
    const v = l.split(";").map(limpar);
    const caderno = cadernos.get(v[C.prova]) ?? { area: v[C.area] as Area, cor: v[C.cor], itens: [] };
    caderno.itens.push({
      posicao: Number(v[C.posicao]),
      gabarito: v[C.gabarito],
      a: num(v[C.a] || "0"), b: num(v[C.b] || "0"), c: num(v[C.c] || "0"),
      anulado: v[C.aban] === "1" || !v[C.a],
      idioma: v[C.lingua] === "0" ? "ingles" : v[C.lingua] === "1" ? "espanhol" : null,
    });
    cadernos.set(v[C.prova], caderno);
  }
  // Desde 2017 o INEP numera LC em 50 posições (1-5 inglês, 6-10 espanhol, depois 11-50), enquanto
  // o enem.dev usa 1-5 para as duas línguas. Traz o espanhol e o resto da prova 5 posições para trás.
  for (const { itens } of cadernos.values()) {
    const ingles = itens.filter((i) => i.idioma === "ingles").map((i) => i.posicao);
    const espanhol = itens.filter((i) => i.idioma === "espanhol").map((i) => i.posicao);
    if (!ingles.length || !espanhol.length || Math.min(...espanhol) <= Math.max(...ingles)) continue;
    const fim = Math.max(...espanhol);
    for (const i of itens) if (i.idioma === "espanhol" || i.posicao > fim) i.posicao -= espanhol.length;
  }
  return cadernos;
}

// Liga cada questão do banco ao item do caderno com o mesmo idioma na posição numero + deslocamento.
// O deslocamento cobre provas em que a área começa em outro número (ex.: 46 em vez de 91).
function parear(questoes: Questao[], itens: ItemInep[], deslocamento: number): [Questao, ItemInep][] {
  const mapa = new Map(itens.map((i) => [`${i.posicao}-${i.idioma ?? "pt"}`, i]));
  return questoes.flatMap((q) => {
    const item = mapa.get(`${q.numero + deslocamento}-${q.idioma ?? "pt"}`);
    return item ? [[q, item] as [Questao, ItemInep]] : [];
  });
}

const DESLOCAMENTOS = [-135, -90, -45, 0, 45, 90, 135];

for (const arquivo of arquivos) {
  const ano = Number(path.basename(arquivo).match(/(\d{4})/)?.[1]);
  const destino = path.join(process.cwd(), "data", "questoes", `${ano}.json`);
  if (!ano || !existsSync(destino)) {
    console.error(`${arquivo}: rode antes "npm run baixar -- ${ano || "<ano>"}" para baixar as questões desse ano.`);
    continue;
  }
  const questoes = JSON.parse(readFileSync(destino, "utf8")) as Questao[];
  const cadernos = lerCsv(arquivo);
  // Recalcula tudo do zero, para uma importação anterior errada não deixar restos.
  for (const q of questoes) {
    delete q.tri;
    delete q.anulada;
  }
  // A área de cada bloco de 45 questões é a do caderno cujos gabaritos mais batem com o bloco.
  // Não dá para usar o número direto: em alguns anos o INEP e o enem.dev numeram as áreas em ordens diferentes.
  const areaDoNumero = new Map<number, Area>();
  for (let bloco = 0; bloco < 4; bloco++) {
    const doBloco = questoes.filter((q) => Math.floor((q.numero - 1) / 45) === bloco);
    let melhor = { area: null as Area | null, acertos: 0 };
    for (const cad of cadernos.values()) {
      for (const d of DESLOCAMENTOS) {
        const acertos = parear(doBloco, cad.itens, d).filter(([q, i]) => q.gabarito === i.gabarito).length;
        if (acertos > melhor.acertos) melhor = { area: cad.area, acertos };
      }
    }
    if (melhor.area && melhor.acertos >= doBloco.length * MINIMO_CONCORDANCIA) {
      for (const q of doBloco) areaDoNumero.set(q.numero, melhor.area);
    }
  }
  const corrigidas = corrigirAreas(questoes, areaDoNumero);
  if (corrigidas) console.log(`${ano}: ${corrigidas} questões estavam com a área errada no enem.dev e foram corrigidas.`);

  for (const area of AREAS) {
    const doBanco = questoes.filter((q) => q.area === area);
    const totalBanco = doBanco.length;
    if (totalBanco === 0) continue;
    let melhor: { codigo: string; cor: string; acertos: number; pares: [Questao, ItemInep][] } | null = null;

    for (const [codigo, cad] of cadernos) {
      if (cad.area !== area) continue;
      for (const d of DESLOCAMENTOS) {
        const pares = parear(doBanco, cad.itens, d);
        const acertos = pares.filter(([q, i]) => q.gabarito === i.gabarito).length;
        if (!melhor || acertos > melhor.acertos) melhor = { codigo, cor: cad.cor, acertos, pares };
      }
    }

    if (!melhor || melhor.acertos / totalBanco < MINIMO_CONCORDANCIA) {
      console.log(`${ano} ${area}: nenhum caderno bateu com o banco (melhor: ${melhor?.acertos ?? 0} de ${totalBanco}). Parâmetros não importados.`);
      continue;
    }
    for (const [q, item] of melhor.pares) {
      if (item.anulado) {
        q.anulada = true;
        continue;
      }
      // Só usa o item quando o gabarito confere, para não atribuir parâmetros à questão errada.
      if (item.gabarito === q.gabarito) q.tri = { a: item.a, b: item.b, c: item.c };
    }
    console.log(`${ano} ${area}: caderno ${melhor.cor} (${melhor.codigo}), ${melhor.acertos} de ${totalBanco} questões com gabarito conferido.`);
  }
  writeFileSync(destino, JSON.stringify(questoes));
}
