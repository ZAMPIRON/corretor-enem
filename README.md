# Corretor ENEM

App web para alunos estudarem para o ENEM:

- **Simulados**: sorteia questões reais do ENEM de todos os anos (escolhendo áreas, anos e quantidade, de 1 a 180) ou monta a prova completa de uma área num ano. O aluno resolve com enunciado, imagens e alternativas, e no fim recebe a nota TRI por área e revisa cada questão com o gabarito.
- **Redação**: correção por IA nas 5 competências do ENEM (0 a 200 cada), com comentários.
- **Histórico**: notas salvas no navegador do aluno.

Feito com Next.js e TypeScript. Tudo roda nos planos gratuitos da Vercel e do Google AI Studio.

## Rodar no seu computador

Precisa do Node.js 22 ou mais novo (https://nodejs.org).

```bash
npm install
npm run baixar               # baixa todas as questões do ENEM (leva uns 2 minutos)
cp .env.example .env.local   # depois coloque sua chave do Gemini nesse arquivo
npm run dev
```

Abra http://localhost:3000.

Para rodar os testes do cálculo TRI: `npm test`.

## 1. Baixar o banco de questões

O app vem só com 17 questões de exemplo, inventadas para teste. O comando abaixo baixa todas as provas do ENEM disponíveis na API pública e gratuita do [enem.dev](https://enem.dev) (de 2009 em diante, com texto, imagens e gabarito oficial):

```bash
npm run baixar             # todos os anos
npm run baixar -- 2023     # só um ano
```

As questões ficam em `data/questoes/<ano>.json`. Quando o banco real existe, as questões de exemplo somem sozinhas do app. As imagens continuam hospedadas no enem.dev e são carregadas pelo navegador do aluno.

Questões com imagem quebrada ficam marcadas como incompletas e não entram nos sorteios.

## 2. Juntar os parâmetros TRI oficiais

Sem os parâmetros, o simulado mostra só os acertos. Para ter nota TRI:

1. Baixe os microdados do ENEM de um ano em https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/enem
2. Dentro do zip, ache o arquivo `DADOS/ITENS_PROVA_<ano>.csv`.
3. Rode: `npm run importar -- caminho/para/ITENS_PROVA_2023.csv` (pode passar vários anos de uma vez).

O banco do enem.dev segue a numeração de um único caderno. O importador descobre qual comparando a sequência de gabaritos de cada área com a de cada caderno do INEP, e só grava os parâmetros nas questões cujo gabarito confere. Questões anuladas pelo INEP ficam marcadas e saem dos sorteios. Ele mostra no terminal qual caderno usou em cada área.

Como o INEP coloca todos os anos na mesma escala, um simulado que mistura questões de anos diferentes também tem nota TRI válida. A nota só aparece numa área quando há pelo menos 5 questões com parâmetros.

Rodar `npm run baixar` de novo mantém os parâmetros já importados.

## 3. Chave gratuita do Gemini (para a correção de redação)

1. Entre em https://aistudio.google.com/apikey com sua conta Google e crie uma chave.
2. Cole em `.env.local` na linha `GEMINI_API_KEY=`.

O plano gratuito tem limite de pedidos por minuto e por dia. Se estourar, o app avisa o aluno para tentar de novo depois.

## Publicar de graça na Vercel

1. Rode `npm run baixar` (e o importador, se tiver os microdados) e suba a pasta inteira, com `data/questoes`, para um repositório no GitHub.
2. Em https://vercel.com, entre com o GitHub, clique em **Add New Project** e escolha o repositório.
3. Em **Environment Variables**, adicione `GEMINI_API_KEY` com sua chave.
4. Clique em **Deploy**.

## O que ainda falta

- **Calibrar a escala da nota TRI.** A conversão de theta para a escala do ENEM está em `lib/provas.ts` (`ESCALA`) com valores iniciais (500 + 100 × theta). Precisa ser ajustada por área comparando com as notas reais dos alunos nos microdados.
- **Calibrar a correção de redação** com redações que já têm nota oficial, ajustando as instruções em `app/api/redacao/route.ts`.
- Filtrar por matéria (física, química, biologia...): a API não classifica as questões por matéria, só por área.

## Estrutura

- `lib/tri.ts`: cálculo da TRI (modelo de 3 parâmetros, estimativa EAP).
- `lib/provas.ts`: formato das questões, áreas e escala.
- `lib/banco.ts`: leitura do banco, sorteio e prova completa.
- `scripts/baixar-questoes.ts`: baixa o banco do enem.dev.
- `scripts/importar-itens.ts`: junta os parâmetros TRI do INEP.
- `app/simulado`: montagem, prova e resultado.
- `app/api/simulado`, `app/api/corrigir`: sorteio e correção (o gabarito nunca vai para o navegador antes do fim).
- `app/api/redacao/route.ts`: chamada ao Gemini.
