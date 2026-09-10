import { NextResponse } from "next/server";
import { mapAuthError } from "@/lib/auth-errors";
import { supabaseAdmin } from "@/lib/operator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function findUserByEmail(
  admin: NonNullable<ReturnType<typeof supabaseAdmin>>,
  email: string,
) {
  for (let page = 1; page <= 8; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    const hit = (data.users ?? []).find((user) => user.email?.trim().toLowerCase() === email);
    if (hit) return hit;
    if ((data.users ?? []).length < 200) break;
  }
  return null;
}

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

  const existing = await findUserByEmail(admin, email);
  if (existing && !existing.email_confirmed_at) {
    const confirmed = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (confirmed.error) {
      return NextResponse.json({ error: mapAuthError(confirmed.error.message) }, { status: 400 });
    }
    return NextResponse.json({ ok: true, existed: true, confirmed: true });
  }

  return NextResponse.json({ ok: true, existed: true });
}
