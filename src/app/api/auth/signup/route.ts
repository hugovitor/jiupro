import { NextResponse } from "next/server";
import { mapAuthError } from "@/lib/auth-errors";
import { supabaseAdmin } from "@/lib/operator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let email = "";
  let password = "";
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    email = String(body.email ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (!email.includes("@") || password.length < 6) {
    return NextResponse.json({ error: "Informe e-mail e senha (mínimo 6)." }, { status: 400 });
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "missing-admin" }, { status: 503 });
  }

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (!created.error) {
    return NextResponse.json({ ok: true, existed: false });
  }

  if (!/already|registered|exists/i.test(created.error.message)) {
    return NextResponse.json({ error: mapAuthError(created.error.message) }, { status: 400 });
  }

  return NextResponse.json({ ok: true, existed: true });
}
