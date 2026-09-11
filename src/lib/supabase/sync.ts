import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "./client";
import { passwordResetUrl, isLocalOrigin, publicAppUrl } from "../app-url";
import { mapAuthError } from "../auth-errors";
import { looksLikeHouseCode } from "../join-code";
import { isStudentJoinNotFound, preferredJoinCode, STUDENT_JOIN_NOT_FOUND, type PublicAcademyJoin } from "../student-join";
import { ensureUuidState, rehomeAcademy, stateToTables, tablesToState } from "./mapper";
import { classFingerprint } from "../roster-identity";
import { DEMO_ACADEMY_ID } from "../seed";
import { isUuid } from "./ids";
import type { AppState, Role, Session } from "../types";

const OPTIONAL_COLUMNS = [
  "cpf",
  "asaas_customer_id",
  "asaas_payment_id",
  "asaas_invoice_url",
  "asaas_pix_copy",
  "asaas_status",
  "validated_at",
  "validated_by",
  "guardian_name",
  "birth_date",
];

function stripOptional(rows: Record<string, unknown>[], columns: string[]) {
  return rows.map((row) => {
    const next = { ...row };
    for (const column of columns) delete next[column];
    return next;
  });
}

async function upsertRows(
  client: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
) {
  if (!rows.length) return;
  let payload = rows;
  let lastError: { message: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await client.from(table).upsert(payload);
    if (!error) return;
    lastError = error;
    const msg = error.message ?? "";
    const named = OPTIONAL_COLUMNS.filter((column) => msg.toLowerCase().includes(column));
    if (named.length) {
      payload = stripOptional(payload, named);
      continue;
    }
    if (/PGRST204|schema cache|could not find|column/i.test(msg)) {
      payload = stripOptional(payload, OPTIONAL_COLUMNS);
      continue;
    }
    throw error;
  }
  if (lastError) throw lastError;
}

async function replaceRows(
  client: SupabaseClient,
  table: string,
  academyId: string,
  rows: Record<string, unknown>[],
  academyColumn = "academy_id",
  opts?: { keepClaimed?: boolean; keepIfEmpty?: boolean; keepRemote?: boolean },
) {
  const { data: existing, error: readError } = await client
    .from(table)
    .select("id")
    .eq(academyColumn, academyId);
  if (readError) throw readError;
  const keep = new Set(rows.map((r) => String(r.id)));
  const claimed = new Set<string>();
  if (opts?.keepClaimed) {
    const linked = await client.from(table).select("id, user_id").eq(academyColumn, academyId);
    if (linked.error) throw linked.error;
    for (const row of linked.data ?? []) {
      const rec = row as { id?: string; user_id?: string | null };
      if (rec.user_id && rec.id) claimed.add(String(rec.id));
    }
  }
  const extra = (existing ?? [])
    .map((r) => String((r as { id: string }).id))
    .filter((id: string) => !keep.has(id) && !claimed.has(id));
  if ((opts?.keepClaimed || opts?.keepIfEmpty || opts?.keepRemote) && !rows.length) {
    /* Lista local vazia não apaga presença / grade / quem já entrou pelo app. */
  } else if (opts?.keepRemote) {
    /* Presença do app de outro aparelho permanece até o dono aceitar ou desistir. */
  } else if (extra.length) {
    const { error } = await client.from(table).delete().in("id", extra);
    if (error) throw error;
  }
  await upsertRows(client, table, rows);
}

async function remapAttendanceRows(
  client: SupabaseClient,
  academyId: string,
  rows: Record<string, unknown>[],
  localClasses: AppState["classes"],
  userId?: string,
) {
  if (!rows.length) return rows;
  const [{ data: roster }, { data: remoteClasses }] = await Promise.all([
    client.from("students").select("id, user_id, email").eq("academy_id", academyId),
    client.from("classes").select("id, weekday, start_time, name, division").eq("academy_id", academyId),
  ]);
  const byUser = (roster ?? []).find((row) => String(row.user_id ?? "") === (userId ?? ""));
  const classIdByPrint = new Map<string, string>();
  for (const row of remoteClasses ?? []) {
    classIdByPrint.set(
      classFingerprint({
        weekday: Number(row.weekday),
        startTime: String(row.start_time ?? "").slice(0, 5),
        name: String(row.name ?? ""),
        division: (String(row.division ?? "adult") as AppState["classes"][number]["division"]) || "adult",
      }),
      String(row.id),
    );
  }
  return rows
    .map((row) => {
      const local = localClasses.find((item) => item.id === String(row.class_id ?? ""));
      const classId = local
        ? (classIdByPrint.get(classFingerprint(local)) ?? String(row.class_id ?? ""))
        : String(row.class_id ?? "");
      const studentId = (byUser?.id ? String(byUser.id) : "") || String(row.student_id ?? "");
      return { ...row, class_id: classId, student_id: studentId };
    })
    .filter((row) => isUuid(String(row.student_id ?? "")) && isUuid(String(row.class_id ?? "")));
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

export async function pushAcademyState(state: AppState, opts?: { refresh?: boolean }) {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "Não foi possível gravar a academia." };
  if (state.academy.id === DEMO_ACADEMY_ID) {
    return { error: "A Equipe Origem é só demonstração." };
  }
  let ready = ensureUuidState(state);
  const originalId = ready.academy.id;

  const { data: sessionUser } = await client.auth.getUser();
  let academyId = ready.academy.id;
  if (sessionUser.user?.id) {
    const { data: profile } = await client
      .from("profiles")
      .select("academy_id")
      .eq("id", sessionUser.user.id)
      .maybeSingle();
    if (profile?.academy_id) academyId = String(profile.academy_id);
  }
  const rehomed = academyId !== originalId;
  if (rehomed && sessionUser.user?.id) {
    ready = rehomeAcademy(ready, academyId, {
      id: sessionUser.user.id,
      email: sessionUser.user.email ?? "",
    });
  }

  const { data: existing, error: lookupError } = await client
    .from("academies")
    .select("id, join_code")
    .eq("id", academyId)
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
  const localCode = String(tables.academy.join_code ?? "").trim().toUpperCase();
  const remoteCode = String(existing.join_code ?? "").trim().toUpperCase();
  if (looksLikeHouseCode(localCode)) {
    tables.academy.join_code = localCode;
  } else if (remoteCode) {
    tables.academy.join_code = remoteCode;
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

  if (ready.session?.role === "student") {
    try {
      const rows = await remapAttendanceRows(
        client,
        ready.academy.id,
        tables.attendance,
        ready.classes,
        sessionUser.user?.id,
      );
      await upsertRows(client, "attendance", rows);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível salvar agora.";
      return { error: message, state: ready };
    }
    return { state: ready };
  }

  const { error: academyError } = await client
    .from("academies")
    .update(tables.academy)
    .eq("id", ready.academy.id);
  if (academyError && /join_code|duplicate|unique|23505/i.test(academyError.message) && remoteCode) {
    tables.academy.join_code = remoteCode;
    const retry = await client.from("academies").update(tables.academy).eq("id", ready.academy.id);
    if (retry.error) return { error: retry.error.message, state: ready };
    ready.academy.joinCode = remoteCode;
  } else if (academyError) {
    return { error: academyError.message, state: ready };
  } else if (looksLikeHouseCode(localCode)) {
    ready.academy.joinCode = localCode;
  }

  try {
    if (rehomed) {
      await upsertRows(client, "students", tables.students);
    } else {
      await replaceRows(client, "students", ready.academy.id, tables.students, "academy_id", {
        keepClaimed: true,
      });
      await replaceRows(client, "classes", ready.academy.id, tables.classes, "academy_id", {
        keepIfEmpty: true,
      });
      await replaceRows(client, "attendance", ready.academy.id, tables.attendance, "academy_id", {
        keepRemote: true,
      });
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
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Não foi possível salvar agora.";
    return { error: message, state: ready };
  }

  if ((rehomed || opts?.refresh) && sessionUser.user?.id) {
    const pulled = await pullAcademyState({
      userId: sessionUser.user.id,
      academyId,
      role: ready.session?.role ?? "owner",
    });
    if (!("error" in pulled)) return { state: pulled };
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

async function provisionAndSignIn(email: string, password: string) {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "offline" as const };

  const provisioned = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).catch(() => null);
  const payload = provisioned
    ? ((await provisioned.json().catch(() => ({}))) as { error?: string })
    : {};

  if (provisioned && provisioned.status === 400 && payload.error) {
    return { error: mapAuthError(payload.error) };
  }

  if (!provisioned || provisioned.status === 503) {
    const signedUp = await client.auth.signUp({ email, password });
    if (signedUp.error && !/already|registered|exists/i.test(signedUp.error.message)) {
      return { error: mapAuthError(signedUp.error.message) };
    }
    if (signedUp.data.session?.user) {
      return { client, user: signedUp.data.session.user as User };
    }
  }

  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (signedIn.data.session?.user) {
    return { client, user: signedIn.data.session.user as User };
  }
  if (/invalid login|invalid credentials/i.test(signedIn.error?.message ?? "")) {
    return { error: "Este e-mail já tem senha. Entre no login com a senha desta conta." };
  }
  return { error: mapAuthError(signedIn.error?.message ?? payload.error) };
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
  joinCode?: string;
}): Promise<{ academyId?: string; ownerId?: string; error?: string; pendingEmail?: boolean }> {
  const auth = await provisionAndSignIn(input.email, input.password);
  if ("error" in auth) {
    if (auth.error === "offline") return {};
    return { error: auth.error };
  }

  const { data: academyId, error: rpcError } = await auth.client.rpc("register_academy", {
    p_name: input.name,
    p_slug: input.slug,
    p_city: input.city,
    p_state: input.state,
    p_plan: input.plan,
    p_owner_name: input.ownerName,
  });
  if (rpcError) return { ownerId: auth.user.id, error: rpcError.message };
  const id = academyId as string;
  const localCode = (input.joinCode ?? "").trim().toUpperCase();
  if (id && looksLikeHouseCode(localCode)) {
    const { error } = await auth.client.from("academies").update({ join_code: localCode }).eq("id", id);
    if (error && !/join_code|duplicate|unique|23505/i.test(error.message)) {
      return { academyId: id, ownerId: auth.user.id, error: error.message };
    }
  }
  return { academyId: id, ownerId: auth.user.id };
}

export async function signInRemote(email: string, password: string) {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "offline" as const };

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: mapAuthError(error?.message ?? "login") };

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
    const created = await provisionAndSignIn(input.email, input.password);
    if ("error" in created) return { error: created.error === "offline" ? "Cole a URL e a anon key do projeto." : created.error };
    ownerId = created.user.id;
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
    return { error: mapAuthError(error.message) };
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

async function lookupRemoteJoinCode(input: {
  code: string;
  slug?: string;
  houseName?: string;
}) {
  const queries = [input.houseName, input.slug, input.code].map((value) => value?.trim() ?? "").filter(Boolean);
  for (const query of queries) {
    const [byName, byCode] = await Promise.all([
      fetch(`/api/aluno/casa?q=${encodeURIComponent(query)}`).catch(() => null),
      fetch(`/api/aluno/casa?casa=${encodeURIComponent(query)}`).catch(() => null),
    ]);
    const nameData = byName
      ? ((await byName.json().catch(() => ({}))) as { houses?: PublicAcademyJoin[] })
      : {};
    const codeData = byCode
      ? ((await byCode.json().catch(() => ({}))) as { house?: PublicAcademyJoin })
      : {};
    const house = nameData.houses?.[0] ?? codeData.house;
    if (!house) continue;
    const code = preferredJoinCode(house);
    if (code) return { house, code };
  }
  return null;
}

export async function joinStudentRemote(input: {
  code: string;
  slug?: string;
  houseName?: string;
  name: string;
  phone: string;
  email: string;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();
  const auth = await provisionAndSignIn(email, input.password);
  if ("error" in auth) {
    if (auth.error === "offline") return { error: "offline" as const };
    return { error: auth.error };
  }

  const client = auth.client;
  const accessUser = auth.user;
  const session = await client.auth.getSession();
  const token = session.data.session?.access_token;
  const house = {
    code: input.code,
    slug: input.slug,
    houseName: input.houseName,
  };

  async function enrollViaApi() {
    if (!token) return null;
    const enrolled = await fetch("/api/aluno/entrar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...house,
        name: input.name,
        phone: input.phone,
      }),
    }).catch(() => null);
    if (!enrolled) return null;
    const payload = (await enrolled.json().catch(() => ({}))) as {
      academyId?: string;
      error?: string;
    };
    return { status: enrolled.status, ...payload };
  }

  const first = await enrollViaApi();
  if (first?.academyId) {
    return {
      session: {
        userId: accessUser.id,
        academyId: first.academyId,
        role: "student" as const,
      } satisfies Session,
    };
  }
  if (first && first.status !== 503 && first.error && !isStudentJoinNotFound(first.error)) {
    return { error: first.error };
  }

  const resolved = await lookupRemoteJoinCode(house);
  if (resolved) {
    house.code = resolved.code;
    house.slug = resolved.house.slug;
    house.houseName = resolved.house.name;
    const retry = await enrollViaApi();
    if (retry?.academyId) {
      return {
        session: {
          userId: accessUser.id,
          academyId: retry.academyId,
          role: "student" as const,
        } satisfies Session,
      };
    }
    if (retry && retry.status !== 503 && retry.error && !isStudentJoinNotFound(retry.error)) {
      return { error: retry.error };
    }

    const rpc = await client.rpc("join_academy_as_student", {
      p_code: resolved.code,
      p_name: input.name,
      p_phone: input.phone,
    });
    if (!rpc.error && rpc.data) {
      return {
        session: {
          userId: accessUser.id,
          academyId: String(rpc.data),
          role: "student" as const,
        } satisfies Session,
      };
    }
    if (rpc.error && !isStudentJoinNotFound(rpc.error.message)) {
      return { error: rpc.error.message };
    }
  }

  if (first?.error) return { error: first.error };
  return { error: STUDENT_JOIN_NOT_FOUND };
}
