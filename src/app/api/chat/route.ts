import { NextResponse } from "next/server";
import { answerChat, parseAudience } from "@/lib/chatbot/engine";
import { greeting } from "@/lib/chatbot/knowledge";
import type { ChatContext, ChatReply } from "@/lib/chatbot/knowledge";
import type { PlanId } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLANS: PlanId[] = ["essencial", "academia", "equipe"];

type Body = {
  message?: string;
  audience?: string;
  academyName?: string;
  plan?: string;
  history?: { role?: string; content?: string }[];
};

function contextFrom(body: Body): ChatContext {
  const plan = PLANS.includes(body.plan as PlanId) ? (body.plan as PlanId) : undefined;
  return {
    audience: parseAudience(body.audience),
    academyName: String(body.academyName ?? "").slice(0, 80) || undefined,
    plan,
  };
}

async function polishWithLlm(
  message: string,
  grounded: ChatReply,
  ctx: ChatContext,
  history: { role: string; content: string }[],
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const prior = history
    .slice(-6)
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: String(item.content ?? "").slice(0, 500),
    }));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 280,
        messages: [
          {
            role: "system",
            content:
              "Você é o assistente do TatameX, sistema de gestão para academias de Jiu-Jitsu. Responda em português do Brasil, curto, direto. Use só o conteúdo fundamentado. Não invente preço, integração ou prazo. Se faltar dado, diga para o WhatsApp. Não peça CPF.",
          },
          {
            role: "system",
            content: `Público: ${ctx.audience}. Academia: ${ctx.academyName ?? "—"}. Plano: ${ctx.plan ?? "—"}.\nResposta fundamentada:\n${grounded.text}`,
          },
          ...prior,
          { role: "user", content: message.slice(0, 500) },
        ],
      }),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const ctx = contextFrom(body);
  const message = String(body.message ?? "").slice(0, 500);
  const grounded = message.trim() ? answerChat(message, ctx) : greeting(ctx);

  const history = Array.isArray(body.history)
    ? body.history.map((item) => ({
        role: String(item.role ?? "user"),
        content: String(item.content ?? ""),
      }))
    : [];
  const polished = message.trim()
    ? await polishWithLlm(message, grounded, ctx, history)
    : null;

  return NextResponse.json({
    ...grounded,
    text: polished || grounded.text,
    source: polished ? "ai" : "kb",
  });
}
