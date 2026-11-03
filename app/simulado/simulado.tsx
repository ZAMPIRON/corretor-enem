"use client";

import { useMemo, useState } from "react";
import { estimarTheta } from "@/lib/tri.ts";
import { ESCALA, type Prova } from "@/lib/provas.ts";
import { salvarRegistro } from "@/lib/historico.ts";

const LETRAS = ["A", "B", "C", "D", "E"];

interface Resultado { acertos: number; total: number; nota: number; erro: number }

export default function Simulado({ provas }: { provas: Prova[] }) {
  const [id, setId] = useState(provas[0]?.id ?? "");
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const prova = useMemo(() => provas.find((p) => p.id === id), [provas, id]);

  if (!prova) return <p>Nenhuma prova cadastrada. Veja o README para importar os dados do INEP.</p>;

  function trocarProva(novo: string) {
    setId(novo);
    setRespostas({});
    setResultado(null);
  }

  function marcar(posicao: number, letra: string) {
    setResultado(null);
    setRespostas((r) => ({ ...r, [posicao]: r[posicao] === letra ? "" : letra }));
  }

  function calcular() {
    if (!prova) return;
    // Itens anulados pelo INEP não entram na nota.
    const validos = prova.itens.filter((i) => !i.anulado);
    const acertos = validos.map((i) => respostas[i.posicao] === i.gabarito);
    const { theta, erroPadrao } = estimarTheta(validos, acertos);
    const escala = ESCALA[prova.area];
    const r = {
      acertos: acertos.filter(Boolean).length,
      total: validos.length,
      nota: Math.round(escala.media + escala.desvio * theta),
      erro: Math.round(escala.desvio * erroPadrao),
    };
    setResultado(r);
    salvarRegistro({ tipo: "simulado", data: new Date().toISOString(), prova: prova.nome, acertos: r.acertos, total: r.total, nota: r.nota, oficial: prova.oficial });
  }

  const marcadas = Object.values(respostas).filter(Boolean).length;

  return (
    <>
      <label htmlFor="prova">Prova</label>
      <select id="prova" value={id} onChange={(e) => trocarProva(e.target.value)}>
        {provas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>
      {!prova.oficial && (
        <p className="aviso">Esta é uma prova de exemplo com parâmetros fictícios, só para testar o app. A nota não corresponde a nenhuma prova real.</p>
      )}

      <div className="cartao">
        <div className="grade">
          {prova.itens.map((item) => {
            const marcada = respostas[item.posicao];
            const estado = resultado && !item.anulado ? (marcada === item.gabarito ? " certa" : " errada") : "";
            return (
              <div key={item.posicao} className={"questao" + estado} title={item.anulado ? "Questão anulada" : undefined}>
                <span className="num">{item.posicao}</span>
                {LETRAS.map((l) => (
                  <button key={l} type="button" className={"alt" + (marcada === l ? " marcada" : "")} onClick={() => marcar(item.posicao, l)} aria-label={`Questão ${item.posicao}, alternativa ${l}`}>
                    {l}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="linha">
        <button className="botao" onClick={calcular}>Calcular nota</button>
        <span className="suave">{marcadas} de {prova.itens.length} marcadas. Questões em branco contam como erro.</span>
      </div>

      {resultado && (
        <div className="cartao">
          <div className="suave">Nota TRI estimada</div>
          <div className="nota-grande">{resultado.nota}</div>
          <p>{resultado.acertos} acertos de {resultado.total} questões válidas. Margem de cerca de {resultado.erro} pontos para mais ou para menos.</p>
          <p className="suave">Na TRI, duas pessoas com o mesmo número de acertos podem ter notas diferentes: acertar questões difíceis e errar fáceis é visto como chute e pesa menos. As questões em verde você acertou, e as em vermelho errou.</p>
        </div>
      )}
    </>
  );
}
