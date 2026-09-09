import { isOperatorEmail } from "@/lib/operator";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureBrowserAuthSession } from "@/lib/supabase/session";
import { passwordFor } from "@/lib/vault";

const TOKEN_KEY = "jiupro.operator.jwt";

function readCachedToken() {
  if (typeof window === "undefined") return null;
  const token = window.sessionStorage.getItem(TOKEN_KEY);
  if (!token || !tokenAlive(token)) {
    if (token) window.sessionStorage.removeItem(TOKEN_KEY);
    return null;
  }
  return token;
}

function tokenAlive(token: string) {
  try {
    const part = token.split(".")[1];
    if (!part) return false;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((part.length + 3) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now() + 15_000;
  } catch {
    return false;
  }
}

export function clearOperatorToken() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
}

function saveOperatorToken(token: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(TOKEN_KEY, token);
}

async function requestOperatorSession(email: string, password: string) {
  const res = await fetch("/api/operacao/session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
  };
  if (!res.ok || !data.access_token) {
    return { error: data.error ?? "Não abriu a sessão da operação." };
  }

  saveOperatorToken(data.access_token);
  const client = createSupabaseBrowserClient();
  if (client && data.refresh_token) {
    await client.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
  }
  return { token: data.access_token };
}

export async function operatorAccessToken(email?: string | null, password?: string | null) {
  const cached = readCachedToken();
  if (cached) return { token: cached };

  const client = createSupabaseBrowserClient();
  if (client) {
    const existing = await ensureBrowserAuthSession(client);
    if (existing) {
      saveOperatorToken(existing);
      return { token: existing };
    }
  }

  const needle = email?.trim().toLowerCase() ?? "";
  if (!needle || !isOperatorEmail(needle)) {
    return { token: null, error: "Entre com o e-mail da operação." };
  }
  const secret = password?.trim() || passwordFor(needle) || "";
  if (!secret) {
    return { token: null, error: "Digite a senha da conta para abrir a planilha." };
  }

  const issued = await requestOperatorSession(needle, secret);
  if ("error" in issued) return { token: null, error: issued.error };
  return { token: issued.token };
}

export async function operatorHeaders(
  email?: string | null,
  password?: string | null,
): Promise<HeadersInit> {
  const { token } = await operatorAccessToken(email, password);
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
    "x-jiupro-access-token": token,
  };
}
