import { COMPETENCIAS, nivel, type Correcao } from "@/lib/redacao.ts";

const INSTRUCOES = `Você é um corretor experiente da redação do ENEM e segue a Cartilha do Participante do INEP.
Avalie a redação dissertativo-argumentativa abaixo nas 5 competências:
${COMPETENCIAS.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Regras:
- Cada competência recebe exatamente um destes níveis: 0, 40, 80, 120, 160 ou 200.
- Seja rigoroso como a banca: 200 só quando o critério for plenamente atendido.
- Na competência 5, verifique se a proposta tem agente, ação, meio/modo, finalidade e detalhamento.
- Fuga total ao tema, texto que não seja dissertativo-argumentativo ou com até 7 linhas recebe 0 em todas.
- Nos comentários, aponte trechos concretos do texto e diga o que fazer para subir de nível.
- Responda somente em JSON no formato:
{"competencias":[{"numero":1,"nota":160,"comentario":"..."}, ...5 itens],"resumo":"visão geral em 2 ou 3 frases"}`;

export async function POST(req: Request) {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) {
    return Response.json({ erro: "A correção ainda não foi configurada: falta a variável GEMINI_API_KEY (veja o README)." }, { status: 500 });
  }

  const { tema, texto } = (await req.json()) as { tema?: string; texto?: string };
  if (!texto || texto.trim().split(/\s+/).length < 50) {
    return Response.json({ erro: "Envie uma redação com pelo menos 50 palavras." }, { status: 400 });
  }

  const modelo = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: INSTRUCOES }] },
      contents: [{ role: "user", parts: [{ text: `Tema: ${tema?.trim() || "(não informado)"}\n\nRedação:\n${texto}` }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    console.error("Erro do Gemini:", resposta.status, detalhe);
    const msg = resposta.status === 429
      ? "O limite gratuito de correções foi atingido. Tente de novo em alguns minutos."
      : "Não foi possível corrigir agora. Tente de novo em instantes.";
    return Response.json({ erro: msg }, { status: 502 });
  }

  try {
    const dados = await resposta.json();
    const bruto = JSON.parse(dados.candidates[0].content.parts[0].text) as Omit<Correcao, "total">;
    const competencias = COMPETENCIAS.map((_, i) => {
      const c = bruto.competencias.find((x) => x.numero === i + 1);
      return { numero: i + 1, nota: nivel(Number(c?.nota ?? 0)), comentario: c?.comentario ?? "" };
    });
    const correcao: Correcao = { competencias, total: competencias.reduce((s, c) => s + c.nota, 0), resumo: bruto.resumo ?? "" };
    return Response.json(correcao);
  } catch (e) {
    console.error("Resposta inesperada do Gemini:", e);
    return Response.json({ erro: "A correção veio num formato inesperado. Tente de novo." }, { status: 502 });
  }
}
