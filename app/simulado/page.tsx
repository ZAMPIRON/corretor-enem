import { resumo } from "@/lib/banco.ts";
import Simulado from "./simulado.tsx";

export const dynamic = "force-dynamic";

export default function PaginaSimulado() {
  return (
    <>
      <h1>Simulado</h1>
      <Simulado resumo={resumo()} />
    </>
  );
}
