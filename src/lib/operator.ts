import { createClient } from "@supabase/supabase-js";

const DEFAULT_OPERATORS = ["hugovitormnunes@gmail.com"];

export function operatorEmails() {
  const extra = [
    process.env.JIUPRO_OPERATOR_EMAILS,
    process.env.NEXT_PUBLIC_JIUPRO_OPERATOR_EMAILS,
  ]
    .flatMap((value) => (value ?? "").split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_OPERATORS, ...extra]);
}

export function isOperatorEmail(email?: string | null) {
  if (!email) return false;
  return operatorEmails().has(email.trim().toLowerCase());
}

export async function requireOperator(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return { error: "Entre de novo com a conta do JiuPro.", status: 401 as const };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    return { error: "Supabase não está ligado neste deploy.", status: 503 as const };
  }

  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  const email = data.user?.email?.trim().toLowerCase();
  if (error || !email || !isOperatorEmail(email)) {
    return { error: "Sem acesso ao painel do JiuPro.", status: 403 as const };
  }
  return { email, userId: data.user!.id };
}

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
