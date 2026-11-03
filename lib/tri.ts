// Cálculo de nota TRI no modelo de 3 parâmetros (ML3) usado pelo ENEM.
// A estimativa da proficiência usa EAP (média a posteriori) com priori normal padrão,
// como o INEP descreve na nota técnica do ENEM.

export interface Item {
  a: number; // discriminação (NU_PARAM_A)
  b: number; // dificuldade (NU_PARAM_B)
  c: number; // acerto ao acaso (NU_PARAM_C)
}

export interface Config {
  // Constante de escala da logística. Valor a confirmar contra notas reais dos microdados.
  D: number;
  // Conversão da escala theta para a escala do ENEM: nota = media + desvio * theta.
  // Valores a calibrar por área no passo 2.
  media: number;
  desvio: number;
  // Pontos de quadratura usados na integração do EAP.
  pontos: number;
  limite: number;
}

export const CONFIG_PADRAO: Config = { D: 1.0, media: 500, desvio: 100, pontos: 81, limite: 4 };

// Probabilidade de acerto do item para uma proficiência theta.
export function probAcerto(item: Item, theta: number, D = CONFIG_PADRAO.D): number {
  return item.c + (1 - item.c) / (1 + Math.exp(-D * item.a * (theta - item.b)));
}

// Estima theta por EAP a partir das respostas (true = acerto, false = erro).
export function estimarTheta(itens: Item[], acertos: boolean[], cfg: Config = CONFIG_PADRAO): { theta: number; erroPadrao: number } {
  if (itens.length !== acertos.length) throw new Error("itens e acertos precisam ter o mesmo tamanho");
  let somaPeso = 0, somaTheta = 0, somaTheta2 = 0;
  for (let k = 0; k < cfg.pontos; k++) {
    const theta = -cfg.limite + (2 * cfg.limite * k) / (cfg.pontos - 1);
    let logVero = -0.5 * theta * theta; // priori N(0,1), sem a constante
    for (let i = 0; i < itens.length; i++) {
      const p = probAcerto(itens[i], theta, cfg.D);
      logVero += Math.log(acertos[i] ? p : 1 - p);
    }
    const peso = Math.exp(logVero);
    somaPeso += peso;
    somaTheta += peso * theta;
    somaTheta2 += peso * theta * theta;
  }
  const theta = somaTheta / somaPeso;
  return { theta, erroPadrao: Math.sqrt(somaTheta2 / somaPeso - theta * theta) };
}

// Nota na escala do ENEM a partir das respostas.
export function notaTRI(itens: Item[], acertos: boolean[], cfg: Config = CONFIG_PADRAO): number {
  const { theta } = estimarTheta(itens, acertos, cfg);
  return cfg.media + cfg.desvio * theta;
}

// Compara respostas marcadas com o gabarito ("A".."E"); questões em branco contam como erro.
export function corrigir(respostas: string, gabarito: string): boolean[] {
  return [...gabarito].map((g, i) => respostas[i] === g);
}
