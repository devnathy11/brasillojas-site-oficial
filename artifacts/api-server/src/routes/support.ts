import { Router } from "express";
import OpenAI from "openai";

const OPENAI_BASE_URL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const OPENAI_API_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

const router = Router();

const SYSTEM_PROMPT = `Você é a assistente virtual da BrasilLojas, uma loja online brasileira de confiança. Seu nome é Bruna e você representa a BrasilLojas com simpatia e profissionalismo.

Você pode ajudar os clientes com:
- Informações sobre produtos e categorias disponíveis (Móveis, Eletrodomésticos, Eletrônicos, Roupas & Confecções, Calçados, Brinquedos e mais)
- Como fazer uma compra no site
- Formas de pagamento aceitas: PIX (5% de desconto), Dinheiro na loja ou Cartão na loja
- Informações sobre entrega: produtos das categorias Móveis e Eletrônicos têm entrega em domicílio; todas as outras categorias são retiradas na loja
- Trocas e devoluções: até 7 dias corridos após o recebimento para produtos com defeito ou divergência, sem custo ao cliente
- Criação e gerenciamento de conta
- Carrinho de compras
- Uso de cupons de desconto
- Dúvidas gerais sobre a loja

Regras importantes:
- Responda SEMPRE em português do Brasil, de forma clara, amigável e objetiva
- Se o cliente perguntar sobre status específico de um pedido, oriente-o a acessar "Meus Pedidos" na sua conta
- Não responda perguntas sobre assuntos não relacionados à BrasilLojas (política, esporte, culinária, etc.)
- Nunca invente informações — se não souber algo, diga que vai encaminhar para a equipe de suporte
- Mantenha as respostas curtas e diretas, use emojis com moderação para ser mais amigável`;

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 1000;

const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 20;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

router.post("/support/chat", async (req, res) => {
  if (!OPENAI_BASE_URL || !OPENAI_API_KEY) {
    res.status(503).json({ error: "Assistente virtual não configurado." });
    return;
  }

  const forwardedFor = req.headers["x-forwarded-for"];
  const ip =
    (typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : undefined) ||
    req.socket.remoteAddress ||
    "unknown";
  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Muitas solicitações. Aguarde um momento e tente novamente." });
    return;
  }

  const { messages } = req.body as { messages: unknown };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  if (messages.length > MAX_MESSAGES) {
    res.status(400).json({ error: `Maximum ${MAX_MESSAGES} messages allowed per request` });
    return;
  }

  const validMessages: ChatMessage[] = [];
  for (const m of messages) {
    if (
      typeof m === "object" &&
      m !== null &&
      "role" in m &&
      "content" in m &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" &&
      m.content.trim().length > 0 &&
      m.content.length <= MAX_MESSAGE_LENGTH
    ) {
      validMessages.push({ role: m.role, content: m.content.trim() });
    }
  }

  if (validMessages.length === 0) {
    res.status(400).json({ error: "No valid messages provided" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY, baseURL: OPENAI_BASE_URL });

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...validMessages,
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Support chat error:", err);
    res.write(
      `data: ${JSON.stringify({ error: "Erro ao processar sua mensagem. Tente novamente." })}\n\n`
    );
    res.end();
  }
});

export default router;
