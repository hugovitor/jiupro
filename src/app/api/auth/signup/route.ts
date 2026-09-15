import { NextResponse } from "next/server";
import { mapAuthError } from "@/lib/auth-errors";
import { captchaRequired, verifyCaptchaToken } from "@/lib/captcha";
import { supabaseAdmin } from "@/lib/operator";
import {
  RATE_LIMITS,
  clientIp,
  consumeRateLimit,
  rateLimitExceededResponse,
} from "@/lib/rate-limit";
import { requestOriginAllowed } from "@/lib/request-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!requestOriginAllowed(request)) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }

  const ip = clientIp(request);
  const limited = consumeRateLimit(`signup:${ip}`, RATE_LIMITS.signup);
  if (!limited.ok) return rateLimitExceededResponse(limited.retryAfterSec);

  let email = "";
  let password = "";
  let captchaToken = "";
  let intent = "";
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      captchaToken?: string;
      intent?: string;
    };
    email = String(body.email ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
    captchaToken = String(body.captchaToken ?? "");
    intent = String(body.intent ?? "");
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (!email.includes("@") || password.length < 6) {
    return NextResponse.json({ error: "Informe e-mail e senha (mínimo 6)." }, { status: 400 });
  }

  const captcha = await verifyCaptchaToken(captchaToken, ip);
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.error }, { status: 400 });
  }
  if (captchaRequired() && !captchaToken) {
    return NextResponse.json({ error: "Confirme que você não é um robô." }, { status: 400 });
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "missing-admin" }, { status: 503 });
  }

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: intent === "aluno" || intent === "cadastro" ? { intent } : { intent: "app" },
  });

  if (!created.error) {
    return NextResponse.json({ ok: true });
  }

  if (!/already|registered|exists/i.test(created.error.message)) {
    return NextResponse.json({ error: mapAuthError(created.error.message) }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
