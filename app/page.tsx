import Link from "next/link";

export default function Inicio() {
  return (
    <>
      <h1>Descubra sua nota no modelo do ENEM</h1>
      <p className="suave">Faça um simulado com questões de provas anteriores e veja sua nota calculada por TRI, ou envie sua redação para uma correção nas 5 competências.</p>
      <div className="cartao">
        <h2>Simulados com nota TRI</h2>
        <p>Monte simulados com questões reais de todas as provas do ENEM, escolhendo áreas, anos e quantidade, ou refaça a prova completa de um ano. No fim, veja a nota estimada pela Teoria de Resposta ao Item, a mesma usada pelo INEP, e revise cada questão.</p>
        <Link className="botao" href="/simulado">Fazer simulado</Link>
      </div>
      <div className="cartao">
        <h2>Correção de redação</h2>
        <p>Cole sua redação e receba uma nota de 0 a 200 em cada competência, com comentários sobre o que melhorar.</p>
        <Link className="botao" href="/redacao">Corrigir redação</Link>
      </div>
      <p className="suave">As notas são estimativas para estudo e não substituem a correção oficial do INEP.</p>
    </>
  );
}
