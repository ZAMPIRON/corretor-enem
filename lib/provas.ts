export type Area = "CN" | "CH" | "LC" | "MT";

export const NOME_AREA: Record<Area, string> = {
  CN: "Ciências da Natureza",
  CH: "Ciências Humanas",
  LC: "Linguagens e Códigos",
  MT: "Matemática",
};

export interface ItemProva {
  posicao: number;
  gabarito: string; // "A".."E"
  a: number;
  b: number;
  c: number;
  anulado: boolean;
}

export interface Prova {
  id: string;
  nome: string;
  ano: number;
  area: Area;
  // false quando os parâmetros são fictícios (prova de exemplo)
  oficial: boolean;
  itens: ItemProva[];
}

// Conversão de theta para a escala do ENEM por área.
// Valores iniciais; serão calibrados comparando com notas reais dos microdados.
export const ESCALA: Record<Area, { media: number; desvio: number }> = {
  CN: { media: 500, desvio: 100 },
  CH: { media: 500, desvio: 100 },
  LC: { media: 500, desvio: 100 },
  MT: { media: 500, desvio: 100 },
};
