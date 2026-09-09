import { createClient } from "@supabase/supabase-js";
import { isOperatorEmail } from "@/lib/operator";

function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}

function anonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
}

async function findAuthUserId(email: string) {
  const url = supabaseUrl();
  const service = serviceKey();
  if (!url || !service) return null;
  const admin = createClient(url, service, { auth: { persistSession: false } });
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    const found = data.users.find((user) => user.email?.trim().toLowerCase() === email);
    if (found) return found.id;
    if (data.users.length < 200) break;
  }
  return null;
}

export async function issueOperatorSession(email: string, password: string) {
  const needle = email.trim().toLowerCase();
  if (!isOperatorEmail(needle)) {
    return { error: "Sem acesso ao painel do Ponteira.", status: 403 as const };
  }
  if (password.length < 6) {
    return { error: "Informe a senha da conta.", status: 401 as const };
  }

  const url = supabaseUrl();
  const anon = anonKey();
  const service = serviceKey();
  if (!url || !anon) {
    return { error: "Conta online não está ligada neste deploy.", status: 503 as const };
  }

  const auth = createClient(url, anon, { auth: { persistSession: false } });
  let { data, error } = await auth.auth.signInWithPassword({
    email: needle,
    password,
  });

  if (data.session) {
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      email: needle,
      userId: data.session.user.id,
    };
  }

  if (!service) {
    return {
      error: error?.message || "Entre de novo com a conta da operação.",
      status: 401 as const,
    };
  }

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const created = await admin.auth.admin.createUser({
    email: needle,
    password,
    email_confirm: true,
  });

  if (created.error && !/already|registered|exists/i.test(created.error.message)) {
    return { error: created.error.message, status: 400 as const };
  }

  let userId = created.data.user?.id ?? null;
  if (!userId) userId = await findAuthUserId(needle);
  if (userId) {
    const updated = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (updated.error) {
      return { error: updated.error.message, status: 400 as const };
    }
  }

  const retry = await auth.auth.signInWithPassword({ email: needle, password });
  data = retry.data;
  error = retry.error;
  if (!data.session) {
    return {
      error: error?.message || "Não abriu a sessão da operação.",
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
