import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "./client";
import { passwordResetUrl, isLocalOrigin, publicAppUrl } from "../app-url";
import { ensureUuidState, rehomeAcademy, stateToTables, tablesToState } from "./mapper";
import { DEMO_ACADEMY_ID } from "../seed";
import type { AppState, Role, Session } from "../types";

async function replaceRows(
  client: SupabaseClient,
  table: string,
  academyId: string,
  rows: Record<string, unknown>[],
  academyColumn = "academy_id",
) {
  const { data: existing, error: readError } = await client
    .from(table)
    .select("id")
    .eq(academyColumn, academyId);
  if (readError) throw readError;
  const keep = new Set(rows.map((r) => String(r.id)));
  const extra = (existing ?? [])
    .map((r: { id: string }) => String(r.id))
    .filter((id: string) => !keep.has(id));
  if (extra.length) {
    const { error } = await client.from(table).delete().in("id", extra);
    if (error) throw error;
  }
  if (rows.length) {
    const { error } = await client.from(table).upsert(rows);
    if (error) throw error;
  }
}

async function replaceJoin(
  client: SupabaseClient,
  table: string,
  filterColumn: string,
  parentIds: string[],
  rows: Record<string, unknown>[],
) {
  if (parentIds.length) {
    const { error } = await client.from(table).delete().in(filterColumn, parentIds);
    if (error) throw error;
  }
  if (rows.length) {
    const { error } = await client.from(table).upsert(rows);
    if (error) throw error;
  }
}

export async function pushAcademyState(state: AppState) {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "Não foi possível gravar a academia." };
  if (state.academy.id === DEMO_ACADEMY_ID) {
    return { error: "A Equipe Origem é só demonstração." };
  }
  const ready = ensureUuidState(state);

  const { data: existing, error: lookupError } = await client
    .from("academies")
    .select("id, join_code")
    .eq("id", ready.academy.id)
    .maybeSingle();
  if (lookupError) return { error: lookupError.message, state: ready };
  if (!existing) {
    return {
      error: "Esta academia ainda não foi gravada. Tente de novo.",
      missingAcademy: true as const,
      state: ready,
    };
  }

  const { data: profileRows, error: profileError } = await client
    .from("profiles")
    .select("id")
    .eq("academy_id", ready.academy.id);
  if (profileError) return { error: profileError.message, state: ready };
  const profileIds = new Set(
    (profileRows ?? []).map((p: { id: string }) => String(p.id)),
  );
  const tables = stateToTables(ready, profileIds);
  if (!tables.academy.join_code && existing.join_code) {
    tables.academy.join_code = existing.join_code;
  }

  const { data: claimedRows } = await client
    .from("students")
    .select("id, user_id")
    .eq("academy_id", ready.academy.id);
  const claimed = new Map(
    (claimedRows ?? []).map((row) => [String(row.id), row.user_id ? String(row.user_id) : ""]),
  );
  for (const row of tables.students) {
    if (!row.user_id) {
      const prev = claimed.get(String(row.id));
      if (prev) row.user_id = prev;
    }
  }

  const { error: academyError } = await client
    .from("academies")
    .update(tables.academy)
    .eq("id", ready.academy.id);
  if (academyError) return { error: academyError.message, state: ready };

  try {
    await replaceRows(client, "students", ready.academy.id, tables.students);
    await replaceRows(client, "classes", ready.academy.id, tables.classes);
    await replaceRows(client, "attendance", ready.academy.id, tables.attendance);
    await replaceRows(client, "payments", ready.academy.id, tables.payments);
    await replaceRows(client, "expenses", ready.academy.id, tables.expenses);
    await replaceRows(client, "inventory", ready.academy.id, tables.inventory);
    await replaceRows(client, "graduations", ready.academy.id, tables.graduations);
    await replaceRows(client, "evaluations", ready.academy.id, tables.evaluations);
    await replaceRows(client, "posts", ready.academy.id, tables.posts);
    await replaceJoin(
      client,
      "post_likes",
      "post_id",
      tables.posts.map((p) => String(p.id)),
      tables.postLikes,
    );
    await replaceRows(client, "events", ready.academy.id, tables.events);
    await replaceJoin(
      client,
      "event_rsvps",
      "event_id",
      tables.events.map((e) => String(e.id)),
      tables.eventRsvps,
    );
    await replaceRows(client, "sales", ready.academy.id, tables.sales);
    await replaceRows(client, "drop_ins", ready.academy.id, tables.dropIns);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Não foi possível salvar agora.";
    return { error: message, state: ready };
  }
  return { state: ready };
}

export function scheduleRemotePush(state: AppState) {
  if (typeof window === "undefined") return;
  if (state.academy.id === DEMO_ACADEMY_ID) return;
  if (!createSupabaseBrowserClient()) return;
  const handle = window.setTimeout(() => {
    void pushAcademyState(state).then((result) => {
      if (result.error && !("missingAcademy" in result && result.missingAcademy)) {
        console.warn("TatameX: sync Supabase —", result.error);
      }
    });
  }, 800);
  return () => window.clearTimeout(handle);
}

export async function pullAcademyState(session: Session): Promise<AppState | { error: string }> {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "Não foi possível abrir a academia." };
  const academyId = session.academyId;
  const [
    academy,
    profiles,
    students,
    classes,
    attendance,
    payments,
    expenses,
    inventory,
    graduations,
    evaluations,
    posts,
    events,
    sales,
    dropIns,
  ] = await Promise.all([
    client.from("academies").select("*").eq("id", academyId).maybeSingle(),
    client.from("profiles").select("*").eq("academy_id", academyId),
    client.from("students").select("*").eq("academy_id", academyId),
    client.from("classes").select("*").eq("academy_id", academyId),
    client.from("attendance").select("*").eq("academy_id", academyId),
    client.from("payments").select("*").eq("academy_id", academyId),
    client.from("expenses").select("*").eq("academy_id", academyId),
    client.from("inventory").select("*").eq("academy_id", academyId),
    client.from("graduations").select("*").eq("academy_id", academyId),
    client.from("evaluations").select("*").eq("academy_id", academyId),
    client.from("posts").select("*").eq("academy_id", academyId),
    client.from("events").select("*").eq("academy_id", academyId),
    client.from("sales").select("*").eq("academy_id", academyId),
    client.from("drop_ins").select("*").eq("academy_id", academyId),
  ]);

  if (academy.error) return { error: academy.error.message };
  if (!academy.data) return { error: "Academia não encontrada." };

  const postIds = (posts.data ?? []).map((p: { id: string }) => String(p.id));
  const eventIds = (events.data ?? []).map((e: { id: string }) => String(e.id));
  const postLikes = postIds.length
    ? await client.from("post_likes").select("*").in("post_id", postIds)
    : { data: [], error: null };
  const eventRsvps = eventIds.length
    ? await client.from("event_rsvps").select("*").in("event_id", eventIds)
    : { data: [], error: null };

  if (postLikes.error) return { error: postLikes.error.message };
  if (eventRsvps.error) return { error: eventRsvps.error.message };

  return tablesToState({
    academy: academy.data,
    profiles: profiles.data ?? [],
    students: students.data ?? [],
    classes: classes.data ?? [],
    attendance: attendance.data ?? [],
    payments: payments.data ?? [],
    expenses: expenses.data ?? [],
    inventory: inventory.data ?? [],
    graduations: graduations.data ?? [],
    evaluations: evaluations.data ?? [],
    posts: posts.data ?? [],
    postLikes: postLikes.data ?? [],
    events: events.data ?? [],
    eventRsvps: eventRsvps.data ?? [],
    sales: sales.data ?? [],
    dropIns: dropIns.data ?? [],
    session,
  });
}

export async function testSupabaseConnection() {
  const client = createSupabaseBrowserClient();
  if (!client) return { ok: false as const, error: "Cole a URL e a anon key." };
  const { error } = await client.from("academies").select("id").limit(1);
  if (!error) return { ok: true as const };
  const msg = error.message || "";
  if (/does not exist|schema cache|42P01/i.test(msg) || error.code === "PGRST205") {
    return {
      ok: false as const,
      error: "Projeto alcançado, mas ainda vazio. Aplique o schema do TatameX (passo 2).",
      needsSchema: true as const,
    };
  }
  if (/jwt|invalid api key|apikey/i.test(msg)) {
    return { ok: false as const, error: "Chave anônima inválida." };
  }
  return { ok: false as const, error: msg };
}

export async function registerRemoteAcademy(input: {
  email: string;
  password: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  plan: string;
  ownerName: string;
}): Promise<{ academyId?: string; ownerId?: string; error?: string; pendingEmail?: boolean }> {
  const client = createSupabaseBrowserClient();
  if (!client) return {};

  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
  });
  if (error) return { error: error.message };

  const ownerId = data.user?.id;
  if (!data.session) {
    return { ownerId, pendingEmail: true };
  }

  const { data: academyId, error: rpcError } = await client.rpc("register_academy", {
    p_name: input.name,
    p_slug: input.slug,
    p_city: input.city,
    p_state: input.state,
    p_plan: input.plan,
    p_owner_name: input.ownerName,
  });
  if (rpcError) return { ownerId, error: rpcError.message };
  return { academyId: academyId as string, ownerId };
}

export async function signInRemote(email: string, password: string) {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "offline" as const };

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: error?.message ?? "login" };

  let { data: profile } = await client
    .from("profiles")
    .select("id, academy_id, name, role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile && data.session?.access_token) {
    await fetch("/api/auth/ensure-profile", {
      method: "POST",
      credentials: "include",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    const again = await client
      .from("profiles")
      .select("id, academy_id, name, role")
      .eq("id", data.user.id)
      .maybeSingle();
    profile = again.data;
  }

  if (!profile) {
    return {
      userId: data.user.id,
      email: data.user.email ?? email,
      missingProfile: true as const,
    };
  }

  return {
    userId: data.user.id,
    profile,
    session: {
      userId: data.user.id,
      academyId: profile.academy_id as string,
      role: profile.role as Role,
    } satisfies Session,
  };
}

export async function createAcademyForCurrentUser(input: {
  name: string;
  slug: string;
  city: string;
  state: string;
  plan: string;
  ownerName: string;
}) {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "offline" as const };
  const { data: academyId, error } = await client.rpc("register_academy", {
    p_name: input.name,
    p_slug: input.slug,
    p_city: input.city,
    p_state: input.state,
    p_plan: input.plan,
    p_owner_name: input.ownerName,
  });
  if (error) return { error: error.message };
  return { academyId: academyId as string };
}

export async function attachLocalAcademy(input: {
  email: string;
  password: string;
  state: AppState;
}) {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "Cole a URL e a anon key do projeto." };

  let ownerId: string | undefined;
  const signedIn = await client.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (signedIn.data.session?.user) {
    ownerId = signedIn.data.user.id;
  } else {
    const created = await client.auth.signUp({
      email: input.email,
      password: input.password,
    });
    if (created.error) return { error: created.error.message };
    if (!created.data.session) {
      return { error: "Confirme o e-mail e tente entrar de novo." };
    }
    ownerId = created.data.user?.id;
  }
  if (!ownerId) return { error: "Não foi possível autenticar." };

  const { data: academyId, error: rpcError } = await client.rpc("register_academy", {
    p_name: input.state.academy.name,
    p_slug: input.state.academy.slug,
    p_city: input.state.academy.city,
    p_state: input.state.academy.state,
    p_plan: input.state.academy.plan,
    p_owner_name:
      input.state.users.find((u) => u.role === "owner")?.name ?? input.state.academy.name,
  });
  if (rpcError) return { error: rpcError.message };
  if (!academyId) return { error: "Não foi possível criar a academia." };

  const next = rehomeAcademy(input.state, academyId as string, {
    id: ownerId,
    email: input.email,
  });
  const pushed = await pushAcademyState(next);
  if (pushed.error) return { error: pushed.error, state: pushed.state ?? next };
  return { state: pushed.state ?? next };
}

export async function requestPasswordReset(email: string) {
  const client = createSupabaseBrowserClient();
  if (!client) {
    return { error: "Não dá para enviar e-mail agora. Fale no WhatsApp do suporte." };
  }
  const redirectTo = isLocalOrigin(publicAppUrl())
    ? `${window.location.origin}/atualizar-senha`
    : passwordResetUrl();
  const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo,
  });
  if (error && !/not found|unable to find|user not found/i.test(error.message)) {
    return { error: error.message };
  }
  return { ok: true as const };
}

export async function establishRecoverySession() {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "Não dá para abrir a recuperação neste navegador." };

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) return { error: "Este link expirou ou já foi usado. Peça outro." };
  }

  const first = await client.auth.getSession();
  if (first.data.session) {
    return { email: first.data.session.user.email ?? "" };
  }

  if (window.location.hash.includes("access_token") || window.location.hash.includes("type=recovery")) {
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    const second = await client.auth.getSession();
    if (second.data.session) {
      return { email: second.data.session.user.email ?? "" };
    }
  }

  return { error: "Este link é inválido ou já foi usado. Peça outro e-mail." };
}

export async function confirmPasswordReset(password: string) {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "Não dá para salvar a senha agora." };
  const { data, error } = await client.auth.updateUser({ password });
  if (error) return { error: error.message };
  const email = data.user?.email?.trim().toLowerCase() ?? "";
  await client.auth.signOut();
  return { ok: true as const, email };
}

export async function joinStudentRemote(input: {
  code: string;
  name: string;
  phone: string;
  email: string;
  password: string;
}) {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "offline" as const };

  const email = input.email.trim().toLowerCase();
  const signedUp = await client.auth.signUp({
    email,
    password: input.password,
  });

  if (signedUp.error && !/already|registered|exists/i.test(signedUp.error.message)) {
    return { error: signedUp.error.message };
  }

  let accessUser = signedUp.data.session?.user ?? signedUp.data.user;
  if (!signedUp.data.session) {
    const signedIn = await client.auth.signInWithPassword({
      email,
      password: input.password,
    });
    if (signedIn.error || !signedIn.data.user) {
      if (/invalid login|invalid credentials/i.test(signedIn.error?.message ?? "")) {
        return {
          error: "Este e-mail já tem senha. Entre no login com a senha desta conta.",
        };
      }
      if (!signedUp.data.session && signedUp.data.user && !signedIn.data.session) {
        return {
          error: "Confirme o e-mail e abra de novo o link da sua academia.",
          pendingEmail: true as const,
        };
      }
      return { error: signedIn.error?.message ?? "Não entrou na conta." };
    }
    accessUser = signedIn.data.user;
  }

  if (!accessUser) return { error: "Não criou a conta do aluno." };

  let { data: academyId, error: joinError } = await client.rpc("join_academy_as_student", {
    p_code: input.code,
    p_name: input.name,
    p_phone: input.phone,
  });
  if (joinError && /join_academy_as_student|PGRST202|does not exist|schema cache/i.test(joinError.message)) {
    await fetch("/api/aluno/casa", { method: "POST" }).catch(() => undefined);
    const retry = await client.rpc("join_academy_as_student", {
      p_code: input.code,
      p_name: input.name,
      p_phone: input.phone,
    });
    academyId = retry.data;
    joinError = retry.error;
  }
  if (joinError) {
    if (/join_academy_as_student|PGRST202|does not exist|schema cache/i.test(joinError.message)) {
      return {
        error: "Não deu para entrar nesta academia agora. Peça o código de novo no WhatsApp da casa.",
      };
    }
    return { error: joinError.message };
  }

  const { data: profile } = await client
    .from("profiles")
    .select("id, academy_id, role")
    .eq("id", accessUser.id)
    .maybeSingle();

  if (!profile?.academy_id) {
    return { error: "Não vinculou a academia. Confira o código da casa." };
  }
  if (profile.role !== "student") {
    return {
      error: "Este e-mail já é da equipe da academia. Use outro e-mail no app do aluno.",
    };
  }

  return {
    session: {
      userId: String(profile.id),
      academyId: String(academyId ?? profile.academy_id),
      role: "student" as const,
    } satisfies Session,
  };
}
