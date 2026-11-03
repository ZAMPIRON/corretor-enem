// Histórico salvo só no navegador do aluno (sem custo de servidor).

export type Registro =
  | { tipo: "simulado"; data: string; prova: string; acertos: number; total: number; nota: number; oficial: boolean }
  | { tipo: "redacao"; data: string; tema: string; total: number; competencias: number[] };

const CHAVE = "corretor-enem:historico";

export function lerHistorico(): Registro[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? "[]") as Registro[];
  } catch {
    return [];
  }
}

export function salvarRegistro(r: Registro): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify([r, ...lerHistorico()].slice(0, 200)));
  } catch {
    // navegador sem armazenamento: o resultado só não fica no histórico
  }
}

export function limparHistorico(): void {
  try {
    localStorage.removeItem(CHAVE);
  } catch {}
}
