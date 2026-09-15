import { createClient } from "@supabase/supabase-js";
import { isOperatorEmail } from "@/lib/operator";

function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}

function anonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
}

export async function issueOperatorSession(email: string, password: string) {
  const needle = email.trim().toLowerCase();
  if (!isOperatorEmail(needle)) {
    return { error: "Sem acesso ao painel do TatameX.", status: 403 as const };
  }
  if (password.length < 6) {
    return { error: "Informe a senha da conta.", status: 401 as const };
  }

  const url = supabaseUrl();
  const anon = anonKey();
  if (!url || !anon) {
    return { error: "Conta online não está ligada neste deploy.", status: 503 as const };
  }

  const auth = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await auth.auth.signInWithPassword({
    email: needle,
    password,
  });

  if (!data.session) {
    return {
      error: error?.message || "E-mail ou senha da operação incorretos.",
      status: 401 as const,
    };
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    email: needle,
    userId: data.session.user.id,
  };
}
