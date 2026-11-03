export type Area = "LC" | "CH" | "CN" | "MT";
export type Idioma = "ingles" | "espanhol";

export const AREAS: Area[] = ["LC", "CH", "CN", "MT"];

export const NOME_AREA: Record<Area, string> = {
  LC: "Linguagens e Códigos",
  CH: "Ciências Humanas",
  CN: "Ciências da Natureza",
  MT: "Matemática",
};

export interface Alternativa {
  letra: string; // "A".."E"
  texto: string | null;
  imagem: string | null;
}

export interface Questao {
  id: string; // "<ano>-<numero>-<idioma ou pt>"
  ano: number;
  numero: number;
  area: Area;
  idioma: Idioma | null; // só nas questões de língua estrangeira
  contexto: string | null; // texto-base em Markdown, pode ter imagens
  enunciado: string | null;
  alternativas: Alternativa[];
  gabarito: string;
  // true quando falta imagem ou texto de alguma parte da questão
  incompleta: boolean;
  // Parâmetros TRI oficiais do INEP, quando já importados.
  tri?: { a: number; b: number; c: number };
  anulada?: boolean;
  exemplo?: boolean;
}

// Versão enviada ao navegador durante a prova: sem gabarito nem parâmetros.
export type QuestaoPublica = Omit<Questao, "gabarito" | "tri">;

export function publica(q: Questao): QuestaoPublica {
  const { gabarito: _g, tri: _t, ...resto } = q;
  return resto;
}

// Conversão de theta para a escala do ENEM por área.
// Valores iniciais; serão calibrados comparando com notas reais dos microdados.
export const ESCALA: Record<Area, { media: number; desvio: number }> = {
  CN: { media: 500, desvio: 100 },
  CH: { media: 500, desvio: 100 },
  LC: { media: 500, desvio: 100 },
  MT: { media: 500, desvio: 100 },
};

// Mínimo de questões com parâmetros numa área para mostrar nota TRI.
export const MINIMO_TRI = 5;
