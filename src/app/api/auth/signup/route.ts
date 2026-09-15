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

type Intent = "cadastro" | "aluno";

function parseIntent(value: string): Intent | null {
  if (value === "cadastro" || value === "aluno") return value;
  return null;
}

export async function POST(request: Request) {
  if (!requestOriginAllowed(request)) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }

  const ip = clientIp(request);

  let email = "";
  let password = "";
  let captchaToken = "";
  let intent: Intent | null = null;
  let academyName = "";
  let ownerName = "";
  let house = "";
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      captchaToken?: string;
      intent?: string;
      academyName?: string;
      ownerName?: string;
      house?: string;
    };
    email = String(body.email ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
    captchaToken = String(body.captchaToken ?? "");
    intent = parseIntent(String(body.intent ?? "").trim());
    academyName = String(body.academyName ?? "").trim();
    ownerName = String(body.ownerName ?? "").trim();
    house = String(body.house ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const ipLimit = await consumeRateLimit(`signup:${ip}`, RATE_LIMITS.signup);
  if (!ipLimit.ok) return rateLimitExceededResponse(ipLimit.retryAfterSec);
  if (email) {
    const emailLimit = await consumeRateLimit(`signup-email:${email}`, RATE_LIMITS.signup);
    if (!emailLimit.ok) return rateLimitExceededResponse(emailLimit.retryAfterSec);
  }

  if (!intent) {
    return NextResponse.json({ error: "Cadastro só pelo fluxo da academia ou do aluno." }, { status: 400 });
  }
  if (intent === "cadastro" && (academyName.length < 3 || ownerName.length < 2)) {
    return NextResponse.json({ error: "Informe o nome da academia e do dono." }, { status: 400 });
  }
  if (intent === "aluno" && house.length < 3) {
    return NextResponse.json({ error: "Informe a academia do aluno." }, { status: 400 });
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
    user_metadata: { intent, academyName, ownerName, house },
  });

  if (!created.error) {
    return NextResponse.json({ ok: true });
  }

  if (!/already|registered|exists/i.test(created.error.message)) {
    return NextResponse.json({ error: mapAuthError(created.error.message) }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
