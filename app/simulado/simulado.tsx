"use client";

import { useEffect, useState } from "react";
import type { Resumo } from "@/lib/banco.ts";
import { AREAS, NOME_AREA, type Area, type Idioma, type QuestaoPublica } from "@/lib/provas.ts";
import { salvarRegistro } from "@/lib/historico.ts";
import type { Resultado } from "@/app/api/corrigir/route.ts";
import Texto from "./texto.tsx";

const QUANTIDADES = [10, 20, 45, 90, 180];

type Etapa = "montar" | "prova" | "resultado";

export default function Simulado({ resumo }: { resumo: Resumo }) {
  const anosDisponiveis = resumo.anos.map((a) => a.ano);
  const temTri = (ano: number) => (resumo.anos.find((a) => a.ano === ano)?.comTri ?? 0) > 0;
  const semTri = anosDisponiveis.filter((ano) => !temTri(ano));
  const [modo, setModo] = useState<"sorteio" | "completa">("sorteio");
  const [areas, setAreas] = useState<Area[]>(["MT"]);
  const [anos, setAnos] = useState<number[]>([]);
  const [quantidade, setQuantidade] = useState(20);
  const [idioma, setIdioma] = useState<Idioma>("ingles");
  const [soComTri, setSoComTri] = useState(resumo.comTri > 0);
  const [anoCompleta, setAnoCompleta] = useState(anosDisponiveis[0] ?? 0);
  const [areaCompleta, setAreaCompleta] = useState<Area>("MT");

  const [etapa, setEtapa] = useState<Etapa>("montar");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [questoes, setQuestoes] = useState<QuestaoPublica[]>([]);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [atual, setAtual] = useState(0);
  const [inicio, setInicio] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const alternar = <T,>(lista: T[], valor: T) => (lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);

  async function comecar() {
    setCarregando(true);
    setErro("");
    try {
      const corpo = modo === "completa"
        ? { modo, ano: anoCompleta, area: areaCompleta, idioma }
        : { modo, areas: AREAS.filter((a) => areas.includes(a)), anos, quantidade, idioma, soComTri };
      const r = await fetch("/api/simulado", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
      const dados = await r.json();
      if (!r.ok) throw new Error(dados.erro);
      setQuestoes(dados.questoes);
      setRespostas({});
      setAtual(0);
      setResultado(null);
      setInicio(Date.now());
      setEtapa("prova");
      window.scrollTo(0, 0);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setCarregando(false);
    }
  }

  async function finalizar() {
    setCarregando(true);
    setErro("");
    try {
      const r = await fetch("/api/corrigir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: questoes.map((q) => q.id), respostas }),
      });
      if (!r.ok) throw new Error("Não foi possível corrigir agora. Tente de novo.");
      const res = (await r.json()) as Resultado;
      setResultado(res);
      setEtapa("resultado");
      window.scrollTo(0, 0);
      const descricao = modo === "completa"
        ? `ENEM ${anoCompleta}, ${NOME_AREA[areaCompleta]} completa`
        : `Simulado sorteado de ${questoes.length} questões`;
      salvarRegistro({
        tipo: "simulado",
        data: new Date().toISOString(),
        prova: descricao,
        acertos: res.areas.reduce((s, a) => s + a.acertos, 0),
        total: res.areas.reduce((s, a) => s + a.total, 0),
        notas: res.areas.map((a) => ({ area: a.area, nota: a.nota })),
        exemplo: resumo.exemplo,
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setCarregando(false);
    }
  }

  if (etapa === "prova" || (etapa === "resultado" && resultado)) {
    return (
      <Prova
        questoes={questoes}
        respostas={respostas}
        setRespostas={setRespostas}
        atual={atual}
        setAtual={setAtual}
        inicio={inicio}
        resultado={etapa === "resultado" ? resultado : null}
        carregando={carregando}
        erro={erro}
        onFinalizar={finalizar}
        onNovo={() => setEtapa("montar")}
      />
    );
  }

  const anosDaCompleta = resumo.anos.find((a) => a.ano === anoCompleta);

  return (
    <>
      <p className="suave">
        Banco com {resumo.total.toLocaleString("pt-BR")} questões de {resumo.anos.length} {resumo.anos.length === 1 ? "prova" : "provas"}
        {resumo.comTri > 0 && !resumo.exemplo ? `, ${resumo.comTri.toLocaleString("pt-BR")} com parâmetros TRI oficiais.` : "."}
      </p>
      {resumo.exemplo && (
        <p className="aviso">O banco ainda tem só questões de exemplo, inventadas para testar o app. Rode <code>npm run baixar</code> para baixar todas as questões do ENEM (veja o README).</p>
      )}

      <div className="abas" role="tablist">
        <button role="tab" aria-selected={modo === "sorteio"} className={modo === "sorteio" ? "ativa" : ""} onClick={() => setModo("sorteio")}>Simulado sorteado</button>
        <button role="tab" aria-selected={modo === "completa"} className={modo === "completa" ? "ativa" : ""} onClick={() => setModo("completa")}>Prova completa de um ano</button>
      </div>

      <div className="cartao">
        {modo === "sorteio" ? (
          <>
            <label>Áreas</label>
            <div className="linha">
              {AREAS.map((a) => (
                <label key={a} className="opcao"><input type="checkbox" checked={areas.includes(a)} onChange={() => setAreas(alternar(areas, a))} /> {NOME_AREA[a]}</label>
              ))}
            </div>

            <label htmlFor="qtd">Quantidade de questões</label>
            <div className="linha">
              {QUANTIDADES.map((n) => (
                <button key={n} type="button" className={"chip" + (quantidade === n ? " ativa" : "")} onClick={() => setQuantidade(n)}>{n}</button>
              ))}
              <input id="qtd" type="number" min={1} max={180} value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} style={{ width: 90 }} />
            </div>

            <label>Anos <span className="suave">(nenhum marcado = todos)</span></label>
            <div className="linha">
              {anosDisponiveis.map((ano) => {
                const bloqueado = soComTri && !temTri(ano);
                return (
                  <button key={ano} type="button" disabled={bloqueado} title={bloqueado ? "Esta prova ainda não tem parâmetros TRI" : undefined}
                    className={"chip" + (anos.includes(ano) ? " ativa" : "")} onClick={() => setAnos(alternar(anos, ano))}>{ano || "Exemplo"}</button>
                );
              })}
            </div>

            <label className="opcao" style={{ marginTop: 16 }}>
              <input type="checkbox" checked={soComTri} disabled={resumo.comTri === 0} onChange={(e) => {
                setSoComTri(e.target.checked);
                if (e.target.checked) setAnos(anos.filter(temTri));
              }} />
              Só questões com parâmetros TRI (para ter nota TRI)
            </label>
            {soComTri && semTri.length > 0 && (
              <p className="suave">Ainda sem parâmetros TRI: {semTri.join(", ")}. Desmarque a opção acima para usar essas provas (aí o resultado mostra só os acertos).</p>
            )}
          </>
        ) : (
          <>
            <label htmlFor="ano">Ano</label>
            <select id="ano" value={anoCompleta} onChange={(e) => setAnoCompleta(Number(e.target.value))}>
              {anosDisponiveis.map((ano) => <option key={ano} value={ano}>{ano || "Exemplo"}</option>)}
            </select>
            <label htmlFor="area">Área</label>
            <select id="area" value={areaCompleta} onChange={(e) => setAreaCompleta(e.target.value as Area)}>
              {AREAS.filter((a) => anosDaCompleta?.areas.includes(a)).map((a) => <option key={a} value={a}>{NOME_AREA[a]}</option>)}
            </select>
          </>
        )}

        {(modo === "completa" ? areaCompleta === "LC" : areas.includes("LC")) && (
          <>
            <label>Língua estrangeira</label>
            <div className="linha">
              <label className="opcao"><input type="radio" checked={idioma === "ingles"} onChange={() => setIdioma("ingles")} /> Inglês</label>
              <label className="opcao"><input type="radio" checked={idioma === "espanhol"} onChange={() => setIdioma("espanhol")} /> Espanhol</label>
            </div>
          </>
        )}
      </div>

      <button className="botao" disabled={carregando || (modo === "sorteio" && areas.length === 0)} onClick={comecar}>
        {carregando ? "Montando..." : "Começar"}
      </button>
      {erro && <p className="erro">{erro}</p>}
    </>
  );
}

function Cronometro({ inicio, parado }: { inicio: number; parado: boolean }) {
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => {
    if (parado) return;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [parado]);
  const s = Math.floor((agora - inicio) / 1000);
  return <span className="suave">{Math.floor(s / 3600)}h{String(Math.floor((s % 3600) / 60)).padStart(2, "0")}min</span>;
}

interface PropsProva {
  questoes: QuestaoPublica[];
  respostas: Record<string, string>;
  setRespostas: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  atual: number;
  setAtual: (n: number) => void;
  inicio: number;
  resultado: Resultado | null;
  carregando: boolean;
  erro: string;
  onFinalizar: () => void;
  onNovo: () => void;
}

function Prova({ questoes, respostas, setRespostas, atual, setAtual, inicio, resultado, carregando, erro, onFinalizar, onNovo }: PropsProva) {
  const [confirmando, setConfirmando] = useState(false);
  const q = questoes[atual];
  const correcao = resultado?.questoes.find((c) => c.id === q.id);
  const respondidas = questoes.filter((x) => respostas[x.id]).length;
  const estadoDe = (x: QuestaoPublica) => {
    const c = resultado?.questoes.find((r) => r.id === x.id);
    if (c) return c.anulada ? " anulada" : c.certa ? " certa" : " errada";
    return respostas[x.id] ? " respondida" : "";
  };

  function ir(n: number) {
    setAtual(n);
    setConfirmando(false);
    window.scrollTo(0, 0);
  }

  return (
    <>
      {resultado && (
        <div className="cartao">
          <h2 style={{ marginTop: 0 }}>Resultado</h2>
          <div className="notas">
            {resultado.areas.map((a) => (
              <div key={a.area}>
                <div className="suave">{NOME_AREA[a.area]}</div>
                {a.nota !== null ? (
                  <>
                    <div className="nota-grande">{a.nota}</div>
                    <div className="suave">margem de cerca de {a.margem} pontos</div>
                  </>
                ) : (
                  <div className="suave" style={{ margin: "8px 0" }}>Sem nota TRI: só {a.comTri} questões com parâmetros (mínimo 5)</div>
                )}
                <div>{a.acertos} de {a.total} acertos</div>
              </div>
            ))}
          </div>
          <p className="suave">Na TRI, acertar as fáceis e errar as difíceis vale mais do que o contrário, porque o padrão contrário parece chute. Clique nos números abaixo para revisar cada questão.</p>
          <button className="botao" onClick={onNovo}>Fazer outro simulado</button>
        </div>
      )}

      <div className="mapa">
        {questoes.map((x, i) => (
          <button key={x.id} className={"casa" + estadoDe(x) + (i === atual ? " atual" : "")} onClick={() => ir(i)} aria-label={`Ir para a questão ${i + 1}`}>{i + 1}</button>
        ))}
      </div>

      <div className="cartao">
        <div className="linha suave" style={{ justifyContent: "space-between" }}>
          <span>Questão {atual + 1} de {questoes.length} · {q.exemplo ? "Exemplo" : `ENEM ${q.ano}, questão ${q.numero}`} · {NOME_AREA[q.area]}</span>
          {!resultado && <Cronometro inicio={inicio} parado={!!resultado} />}
        </div>
        {q.anulada && <p className="aviso">Esta questão foi anulada pelo INEP e não conta na nota.</p>}
        <Texto>{q.contexto}</Texto>
        <div className="enunciado"><Texto>{q.enunciado}</Texto></div>
        <div className="alternativas">
          {q.alternativas.map((a) => {
            let classe = "alternativa";
            if (respostas[q.id] === a.letra) classe += " marcada";
            if (correcao && a.letra === correcao.gabarito) classe += " gabarito";
            if (correcao && respostas[q.id] === a.letra && !correcao.certa) classe += " errada";
            return (
              <button
                key={a.letra}
                className={classe}
                disabled={!!resultado}
                onClick={() => setRespostas((r) => ({ ...r, [q.id]: r[q.id] === a.letra ? "" : a.letra }))}
              >
                <span className="letra">{a.letra}</span>
                <span>
                  {a.texto && <Texto>{a.texto}</Texto>}
                  {a.imagem && <img src={a.imagem} alt={`Alternativa ${a.letra}`} loading="lazy" />}
                </span>
              </button>
            );
          })}
        </div>
        {correcao && (
          <p className={correcao.certa ? "certo" : "erro"}>
            {correcao.anulada ? "Questão anulada." : correcao.certa ? "Você acertou." : `Resposta certa: ${correcao.gabarito}. ${correcao.marcada ? `Você marcou ${correcao.marcada}.` : "Você deixou em branco."}`}
          </p>
        )}
      </div>

      <div className="linha" style={{ justifyContent: "space-between" }}>
        <div className="linha">
          <button className="botao-leve" disabled={atual === 0} onClick={() => ir(atual - 1)}>Anterior</button>
          <button className="botao-leve" disabled={atual === questoes.length - 1} onClick={() => ir(atual + 1)}>Próxima</button>
        </div>
        {!resultado && (
          confirmando ? (
            <div className="linha">
              <span>{respondidas < questoes.length ? `Faltam ${questoes.length - respondidas} questões, que contam como erro.` : "Tudo respondido."} Finalizar?</span>
              <button className="botao" disabled={carregando} onClick={onFinalizar}>{carregando ? "Corrigindo..." : "Sim, corrigir"}</button>
              <button className="botao-leve" onClick={() => setConfirmando(false)}>Voltar</button>
            </div>
          ) : (
            <button className="botao" onClick={() => setConfirmando(true)}>Finalizar ({respondidas}/{questoes.length})</button>
          )
        )}
      </div>
      {erro && <p className="erro">{erro}</p>}
    </>
  );
}
