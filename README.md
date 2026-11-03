# Corretor ENEM

App web para alunos estudarem para o ENEM:

- **Simulado TRI**: o aluno marca as respostas de uma prova e recebe a nota estimada pela TRI (modelo de 3 parâmetros com estimativa EAP, o mesmo usado pelo INEP).
- **Redação**: correção por IA nas 5 competências do ENEM (0 a 200 cada), com comentários.
- **Histórico**: notas salvas no navegador do aluno.

Feito com Next.js e TypeScript. Tudo roda nos planos gratuitos da Vercel e do Google AI Studio.

## Rodar no seu computador

Precisa do Node.js 22 ou mais novo (https://nodejs.org).

```bash
npm install
cp .env.example .env.local   # depois coloque sua chave do Gemini nesse arquivo
npm run dev
```

Abra http://localhost:3000.

Para rodar os testes do cálculo TRI: `npm test`.

## Chave gratuita do Gemini (para a correção de redação)

1. Entre em https://aistudio.google.com/apikey com sua conta Google e crie uma chave.
2. Cole em `.env.local` na linha `GEMINI_API_KEY=`.

O plano gratuito tem limite de pedidos por minuto e por dia. Se estourar, o app avisa o aluno para tentar de novo depois.

## Colocar as provas oficiais do ENEM

O app vem só com uma prova de exemplo, com parâmetros fictícios. Para usar provas reais:

1. Baixe os microdados do ENEM de um ano em https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/enem
2. Dentro do zip, ache o arquivo `DADOS/ITENS_PROVA_<ano>.csv`.
3. Rode: `npm run importar -- caminho/para/ITENS_PROVA_2023.csv`

Isso cria um arquivo por caderno em `data/provas`, com gabarito e parâmetros TRI de cada questão. Em Linguagens, são criadas versões separadas para inglês e espanhol. Depois disso, a prova de exemplo pode ser apagada (`data/provas/exemplo-mt.json`).

## Publicar de graça na Vercel

1. Suba esta pasta para um repositório no GitHub.
2. Em https://vercel.com, entre com o GitHub, clique em **Add New Project** e escolha o repositório.
3. Em **Environment Variables**, adicione `GEMINI_API_KEY` com sua chave.
4. Clique em **Deploy**.

## O que ainda falta

- **Calibrar a escala da nota TRI.** A conversão de theta para a escala do ENEM está em `lib/provas.ts` (`ESCALA`) com valores iniciais (500 + 100 × theta). Precisa ser ajustada por área comparando com as notas reais dos alunos nos microdados.
- **Calibrar a correção de redação** com redações que já têm nota oficial, ajustando o texto das instruções em `app/api/redacao/route.ts`.
- Mostrar o enunciado das questões (hoje o aluno usa a prova em PDF ao lado e marca só as respostas).

## Estrutura

- `lib/tri.ts`: cálculo da TRI.
- `lib/provas.ts`: formato das provas e escala por área.
- `scripts/importar-itens.ts`: importador dos microdados do INEP.
- `app/simulado`, `app/redacao`, `app/historico`: páginas.
- `app/api/redacao/route.ts`: chamada ao Gemini.
