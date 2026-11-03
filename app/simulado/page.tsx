import { carregarProvas } from "@/lib/carregar-provas.ts";
import Simulado from "./simulado.tsx";

export default function PaginaSimulado() {
  return (
    <>
      <h1>Simulado com nota TRI</h1>
      <p className="suave">Escolha a prova, marque o que você respondeu e calcule a nota.</p>
      <Simulado provas={carregarProvas()} />
    </>
  );
}
