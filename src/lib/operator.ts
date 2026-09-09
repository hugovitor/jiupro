import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const DEFAULT_OPERATORS = ["hugovitormnunes@gmail.com"];

export function operatorEmails() {
  const extra = [
    process.env.JIUPRO_OPERATOR_EMAILS,
    process.env.NEXT_PUBLIC_JIUPRO_OPERATOR_EMAILS,
    process.env.PONTEIRA_OPERATOR_EMAILS,
    process.env.TATAMEX_OPERATOR_EMAILS,
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

async function userFromBearer(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return { missingConfig: true as const };
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.email) return null;
  return data.user;
}

async function userFromCookies(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return null;
  const client = createServerClient(url, anon, {
    cookies: {
      getAll() {
        const header = request.headers.get("cookie") ?? "";
        return header.split(";").flatMap((part) => {
          const trimmed = part.trim();
          if (!trimmed) return [];
          const i = trimmed.indexOf("=");
          if (i < 0) return [];
          return [{ name: trimmed.slice(0, i), value: trimmed.slice(i + 1) }];
        });
      },
      setAll() {
        /* API routes don't write auth cookies */
      },
    },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user?.email) return null;
  return data.user;
}

function accessTokenFromRequest(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.replace(/^Bearer\s+/i, "").trim();
  if (bearer) return bearer;
  return (
    (request.headers.get("x-tatamex-access-token") ??
      request.headers.get("x-jiupro-access-token") ??
      "") as string
  ).trim();
}

export async function requireOperator(request: Request) {
  const token = accessTokenFromRequest(request);

  const fromToken = token ? await userFromBearer(token) : null;
  if (fromToken && "missingConfig" in fromToken) {
    return { error: "Supabase não está ligado neste deploy.", status: 503 as const };
  }

  const user = fromToken ?? (await userFromCookies(request));
  const email = user?.email?.trim().toLowerCase();
  if (!user || !email || !isOperatorEmail(email)) {
    return {
      error: user
        ? "Sem acesso ao painel do TatameX."
        : "Entre de novo com a conta do TatameX.",
      status: user ? (403 as const) : (401 as const),
    };
  }
  return { email, userId: user.id };
}

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
