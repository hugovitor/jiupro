import { greeting, KNOWLEDGE, type ChatAudience, type ChatContext, type ChatReply } from "./knowledge";

function fold(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const GREET = /^(oi+|ola+|e a[ií]|eae|hey|hello|bom dia|boa tarde|boa noite|fala)\b/;
const THANKS = /^(valeu|obrigad[oa]|thanks|tmj|show)\b/;

function tokens(value: string) {
  return fold(value)
    .split(" ")
    .filter((part) => part.length >= 3);
}

function allowed(audiences: ChatAudience[] | "all", audience: ChatAudience) {
  return audiences === "all" || audiences.includes(audience);
}

function scoreEntry(query: string, phrases: string[], keywords: string[]) {
  const q = fold(query);
  const qTokens = new Set(tokens(query));
  let score = 0;

  for (const phrase of phrases) {
    const p = fold(phrase);
    if (!p) continue;
    if (q === p) score += 12;
    else if (q.includes(p) || p.includes(q)) score += 8;
    else {
      const overlap = tokens(phrase).filter((t) => qTokens.has(t)).length;
      if (overlap >= 2) score += overlap * 2;
    }
  }

  for (const key of keywords) {
    const k = fold(key);
    if (k && (q.includes(k) || qTokens.has(k))) score += 2;
  }

  return score;
}

export function answerChat(message: string, ctx: ChatContext): ChatReply {
  const raw = message.trim();
  if (!raw) return greeting(ctx);

  const folded = fold(raw);

  if (GREET.test(folded) && folded.split(" ").length <= 4) {
    return greeting(ctx);
  }
  if (THANKS.test(folded)) {
    return {
      id: "obrigado",
      text: "Fechado. Se aparecer outra dúvida, manda aqui.",
      suggestions: greeting(ctx).suggestions,
    };
  }

  let best: { id: string; score: number; reply: Omit<ChatReply, "id"> } | null = null;
  for (const entry of KNOWLEDGE) {
    if (!allowed(entry.audiences, ctx.audience)) continue;
    const score = scoreEntry(raw, entry.phrases, entry.keywords);
    if (!best || score > best.score) {
      best = { id: entry.id, score, reply: entry.answer(ctx) };
    }
  }

  if (best && best.score >= 4) {
    return { id: best.id, ...best.reply };
  }

  return {
    id: "fallback",
    text: "Não fechei essa. Reformule em uma frase (presença, plano, Pix, aluno) ou fale com gente no WhatsApp — eu mando o atalho.",
    suggestions: greeting(ctx).suggestions,
    handoff: true,
  };
}

export function parseAudience(value: unknown): ChatAudience {
  if (value === "student" || value === "owner" || value === "visitor") return value;
  if (value === "instructor") return "owner";
  return "visitor";
}
