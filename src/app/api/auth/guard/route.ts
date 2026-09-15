import { NextResponse } from "next/server";
import {
  RATE_LIMITS,
  clientIp,
  consumeRateLimit,
  rateLimitExceededResponse,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS = {
  login: RATE_LIMITS.login,
  signup: RATE_LIMITS.signup,
  search: RATE_LIMITS.search,
  reset: RATE_LIMITS.reset,
  join: RATE_LIMITS.join,
} as const;

export async function POST(request: Request) {
  let action: keyof typeof ACTIONS = "login";
  let email = "";
  try {
    const body = (await request.json()) as { action?: string; email?: string };
    if (body.action && body.action in ACTIONS) {
      action = body.action as keyof typeof ACTIONS;
    }
    email = String(body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const ip = clientIp(request);
  const rule = ACTIONS[action];
  const hit = await consumeRateLimit(`guard:${action}:${ip}:${email}`, rule);
  if (!hit.ok) return rateLimitExceededResponse(hit.retryAfterSec);
  return NextResponse.json({ ok: true });
}
