# Corretor ENEM

App web gratuito para alunos que estudam para o ENEM. O aluno faz simulados com questões reais e recebe a nota estimada por TRI, e corrige redações por IA nas 5 competências do ENEM. Orçamento zero: tudo precisa caber em planos gratuitos (Vercel, Google AI Studio, enem.dev). O dono do projeto é o Gustavo, e o app e os textos são em português do Brasil.

## Stack

- Next.js 16 (App Router), React 19, TypeScript 5.9. Sem framework de CSS: estilos em `app/globals.css` com variáveis para tema claro e escuro.
- Node 22+. Scripts e testes rodam direto em TypeScript com `node --experimental-strip-types` (por isso os imports usam extensão `.ts` e o `package.json` tem `"type": "module"`).
- `react-markdown` + `remark-gfm` para mostrar o texto das questões, que vem em Markdown.
- Sem banco de dados: questões em arquivos JSON no repositório, histórico do aluno no `localStorage`.
- Correção de redação pelo Gemini (plano gratuito), via REST, sem SDK.
- Deploy previsto na Vercel (plano gratuito).

## Comandos

```bash
npm install
npm run dev                  # http://localhost:3000
npm run build
npm test                     # testes do cálculo TRI (lib/*.test.ts)
npm run baixar               # baixa todas as questões do enem.dev para data/questoes/<ano>.json
npm run baixar -- 2023       # só um ano
npm run importar -- caminho/ITENS_PROVA_2023.csv   # junta os parâmetros TRI do INEP
```

`.env.local` (modelo em `.env.example`): `GEMINI_API_KEY` e, opcionalmente, `GEMINI_MODEL` (padrão `gemini-2.5-flash`). `ENEM_API` troca a URL base da API do enem.dev (útil para testar com uma API falsa).

## Arquitetura

- `lib/tri.ts`: modelo logístico de 3 parâmetros (ML3) e estimativa da proficiência por EAP com priori N(0,1), usando 81 pontos de quadratura entre -4 e 4. Funções: `probAcerto`, `estimarTheta`, `notaTRI`, `corrigir`.
- `lib/provas.ts`: tipos (`Questao`, `QuestaoPublica`, `Area`, `Idioma`), nomes das áreas, `ESCALA` (conversão de theta para a escala do ENEM por área) e `MINIMO_TRI` (5 questões com parâmetros por área para mostrar nota).
- `lib/banco.ts`: só no servidor. Lê `data/questoes/*.json` (com cache) e oferece `sortear` (divide a quantidade igualmente entre as áreas e deixa de fora as questões incompletas, as anuladas e as do outro idioma), `provaCompleta`, `porIds` e `resumo`. Quando o banco real existe, as questões de exemplo (`exemplo: true`) são ignoradas.
- `app/api/simulado/route.ts`: monta o simulado e devolve as questões **sem gabarito nem parâmetros** (`publica()`).
- `app/api/corrigir/route.ts`: recebe ids e respostas e devolve acertos por área, nota TRI por área (quando a área tem ao menos `MINIMO_TRI` questões com parâmetros) e o gabarito de cada questão.
- `app/api/redacao/route.ts`: chama o Gemini com instruções baseadas na cartilha do INEP, pede JSON e arredonda cada nota para o nível válido mais próximo (0, 40, 80, 120, 160 ou 200).
- `app/simulado/`: `page.tsx` (servidor, passa o resumo do banco), `simulado.tsx` (cliente: montagem, prova e resultado/revisão), `texto.tsx` (Markdown).
- `app/redacao/page.tsx`, `app/historico/page.tsx`, `lib/historico.ts` (`localStorage`), `lib/redacao.ts` (competências).
- `next.config.ts`: `outputFileTracingIncludes` para `data/questoes` ir junto com as rotas do servidor na Vercel.

### Dados

- `data/questoes/<ano>.json`: lista de `Questao`. O id é `<ano>-<numero>-<idioma ou pt>`. Os campos `tri` e `anulada` são preenchidos pelo importador.
- `data/questoes/exemplo.json`: 17 questões inventadas, com parâmetros fictícios, para o app funcionar antes do download (`ano: 0`).
- `scripts/baixar-questoes.ts`: pagina `GET /v1/exams/{ano}/questions?limit=50&offset=N` (o offset é o número da questão e as páginas se sobrepõem em uma) e depois busca o outro idioma com `&language=`. Respeita o limite da API (cerca de 1 pedido por segundo) e tenta de novo quando recebe 429. Marca como `incompleta` a questão com imagem quebrada (`broken-image`). Rodar de novo preserva `tri` e `anulada`.
- `scripts/importar-itens.ts`: lê `ITENS_PROVA_<ano>.csv` dos microdados do INEP (latin1, separador `;`, colunas `CO_POSICAO`, `SG_AREA`, `TX_GABARITO`, `NU_PARAM_A/B/C`, `TX_COR`, `CO_PROVA`, `TP_LINGUA` com 0 para inglês e 1 para espanhol, `IN_ITEM_ABAN`). A numeração do enem.dev segue um único caderno, então para cada área o importador testa cada `CO_PROVA` com deslocamentos de numeração (de -135 a +135, de 45 em 45) e fica com o par que tem mais gabaritos iguais. Exige pelo menos 80% de concordância e só grava parâmetros quando o gabarito da questão confere.

## Decisões tomadas

- Fonte das questões: API pública do enem.dev, porque os PDFs e os microdados do INEP não trazem o texto das questões em formato utilizável. Os parâmetros TRI só existem nos microdados do INEP, daí o importador separado.
- Simulados podem misturar anos: o INEP coloca os itens de todos os anos na mesma escala, então a TRI continua válida.
- Os simulados mostram as questões na ordem das áreas e, dentro de cada área, da mais fácil para a mais difícil quando há parâmetro `b`.
- O gabarito nunca vai para o navegador antes de o aluno finalizar.
- Questão em branco conta como erro. Questão anulada não conta.
- Primeira versão sem login nem Supabase: o histórico fica no navegador. Supabase (plano gratuito) é a opção prevista se precisar de contas.
- O app é um projeto novo. O repositório antigo do Gustavo (`corretor-enem` no GitHub) não foi aproveitado porque não deu para acessá-lo.

## O que já foi feito e testado

- Cálculo TRI com 5 testes passando (`npm test`).
- Build de produção sem erros.
- Simulado sorteado, prova completa, correção, revisão e histórico testados no navegador (Playwright), primeiro com as questões de exemplo e depois com um banco falso de 185 questões com parâmetros.
- `baixar-questoes.ts` testado contra uma imitação local da API do enem.dev, incluindo paginação, idiomas e limite de pedidos.
- `importar-itens.ts` testado com um CSV falso no formato do INEP, incluindo escolha do caderno, deslocamento de numeração, idiomas e item anulado.

## Pendências

1. **Rodar `npm run baixar` de verdade.** Nunca foi rodado contra a API real: o ambiente onde o app foi feito bloqueava `api.enem.dev` e `download.inep.gov.br`. Conferir quantas questões vêm por ano e se o formato bate com o esperado em `converter()`.
2. **Importar os parâmetros do INEP.** Baixar os microdados de cada ano e rodar `npm run importar` com os arquivos `ITENS_PROVA_<ano>.csv`. Conferir no terminal se cada área achou um caderno com boa concordância, principalmente nos anos de 2009 a 2016, quando a ordem dos dias era diferente.
3. **Calibrar a escala da nota TRI.** `ESCALA` em `lib/provas.ts` usa 500 + 100 × theta em todas as áreas, que é só uma aproximação. Calibrar por área comparando a nota calculada com `NU_NOTA_CN/CH/LC/MT` dos participantes nos microdados (dá para conferir também a constante `D` em `lib/tri.ts`).
4. **Testar a correção de redação com uma chave real do Gemini.** Nunca foi chamada de verdade. Conferir o nome do modelo gratuito disponível e o formato da resposta.
5. **Calibrar a correção de redação** com redações que já têm nota oficial. O Gustavo vai mandar redações dele para isso.
6. Publicar na Vercel com `GEMINI_API_KEY` configurada.
7. Ideias para depois: filtrar por matéria (a API só classifica por área), login com Supabase, gráfico de evolução no histórico.
