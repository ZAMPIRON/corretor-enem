"use client";

import { useEffect, useState } from "react";
import { lerHistorico, limparHistorico, type Registro } from "@/lib/historico.ts";

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
                        ? <>{r.prova}<div className="suave">{r.acertos} de {r.total} acertos{r.oficial ? "" : ", prova de exemplo"}</div></>
                        : <>Redação: {r.tema}<div className="suave">Competências: {r.competencias.join(", ")}</div></>}
                    </td>
                    <td className="num-tab"><strong>{r.tipo === "simulado" ? r.nota : r.total}</strong></td>
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
