"use client";

import { useState } from "react";
import { COMPETENCIAS, type Correcao } from "@/lib/redacao.ts";
import { salvarRegistro } from "@/lib/historico.ts";

export default function PaginaRedacao() {
  const [tema, setTema] = useState("");
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [correcao, setCorrecao] = useState<Correcao | null>(null);

  const palavras = texto.trim() ? texto.trim().split(/\s+/).length : 0;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro("");
    setCorrecao(null);
    try {
      const r = await fetch("/api/redacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema, texto }),
      });
      const dados = await r.json();
      if (!r.ok) throw new Error(dados.erro ?? "Erro desconhecido");
      setCorrecao(dados as Correcao);
      salvarRegistro({ tipo: "redacao", data: new Date().toISOString(), tema: tema || "Sem tema", total: dados.total, competencias: dados.competencias.map((c: { nota: number }) => c.nota) });
    } catch (err) {
      setErro(err instanceof Error ? err.message : String(err));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <h1>Correção de redação</h1>
      <p className="suave">A correção é feita por IA seguindo as 5 competências do ENEM. Use como orientação de estudo: a nota pode variar em relação à banca oficial.</p>
      <form onSubmit={enviar}>
        <label htmlFor="tema">Tema da redação</label>
        <input id="tema" type="text" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex.: Desafios para a valorização da herança africana no Brasil" />
        <label htmlFor="texto">Sua redação</label>
        <textarea id="texto" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Cole ou digite seu texto aqui" />
        <div className="linha" style={{ marginTop: 12 }}>
          <button className="botao" disabled={carregando || palavras < 50}>{carregando ? "Corrigindo..." : "Corrigir"}</button>
          <span className="suave">{palavras} palavras</span>
        </div>
      </form>

      {erro && <p className="erro">{erro}</p>}

      {correcao && (
        <div className="cartao">
          <div className="suave">Nota estimada</div>
          <div className="nota-grande">{correcao.total}</div>
          <p>{correcao.resumo}</p>
          <table>
            <tbody>
              {correcao.competencias.map((c) => (
                <tr key={c.numero}>
                  <td>
                    <strong>Competência {c.numero}</strong>
                    <div className="suave">{COMPETENCIAS[c.numero - 1]}</div>
                    <p>{c.comentario}</p>
                  </td>
                  <td className="num-tab"><strong>{c.nota}</strong> / 200</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
