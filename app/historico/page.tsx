"use client";

import { useEffect, useState } from "react";
import { lerHistorico, limparHistorico, type Registro } from "@/lib/historico.ts";
import { NOME_AREA } from "@/lib/provas.ts";

export default function PaginaHistorico() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  useEffect(() => setRegistros(lerHistorico()), []);

  return (
    <>
      <h1>Seu histórico</h1>
      <p className="suave">Fica salvo só neste navegador.</p>
      {registros.length === 0 ? (
        <p>Nenhum simulado ou redação ainda.</p>
      ) : (
        <>
          <div className="cartao">
            <table>
              <thead>
                <tr><th>Data</th><th>O quê</th><th className="num-tab">Nota</th></tr>
              </thead>
              <tbody>
                {registros.map((r, i) => (
                  <tr key={i}>
                    <td>{new Date(r.data).toLocaleDateString("pt-BR")}</td>
                    <td>
                      {r.tipo === "simulado"
                        ? <>{r.prova}<div className="suave">{r.acertos} de {r.total} acertos{r.exemplo ? ", questões de exemplo" : ""}</div></>
                        : <>Redação: {r.tema}<div className="suave">Competências: {r.competencias.join(", ")}</div></>}
                    </td>
                    <td className="num-tab">
                      {r.tipo === "simulado"
                        ? (r.notas ?? []).map((n) => <div key={n.area}>{NOME_AREA[n.area]}: <strong>{n.nota ?? "sem TRI"}</strong></div>)
                        : <strong>{r.total}</strong>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="botao-leve" onClick={() => { limparHistorico(); setRegistros([]); }}>Apagar histórico</button>
        </>
      )}
    </>
  );
}
