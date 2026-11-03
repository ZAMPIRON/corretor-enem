export const COMPETENCIAS = [
  "Domínio da modalidade escrita formal da língua portuguesa",
  "Compreensão da proposta e aplicação de conceitos das várias áreas do conhecimento para desenvolver o tema, dentro dos limites estruturais do texto dissertativo-argumentativo em prosa",
  "Seleção, relação, organização e interpretação de informações, fatos, opiniões e argumentos em defesa de um ponto de vista",
  "Conhecimento dos mecanismos linguísticos necessários para a construção da argumentação",
  "Elaboração de proposta de intervenção para o problema abordado, respeitando os direitos humanos",
];

export interface Competencia {
  numero: number;
  nota: number; // 0, 40, 80, 120, 160 ou 200
  comentario: string;
}

export interface Correcao {
  competencias: Competencia[];
  total: number;
  resumo: string;
}

// Arredonda para o nível válido mais próximo (múltiplo de 40 entre 0 e 200).
export function nivel(nota: number): number {
  return Math.min(200, Math.max(0, Math.round(nota / 40) * 40));
}
