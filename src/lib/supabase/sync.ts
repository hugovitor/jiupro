import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "./client";
import { passwordResetUrl, isLocalOrigin, publicAppUrl } from "../app-url";
import { mapAuthError } from "../auth-errors";
import { looksLikeHouseCode } from "../join-code";
import { isStudentJoinNotFound, preferredJoinCode, STUDENT_JOIN_NOT_FOUND, type PublicAcademyJoin } from "../student-join";
import { mapHouseMembership } from "../memberships";
import { ensureUuidState, rehomeAcademy, stateToTables, tablesToState } from "./mapper";
import { ensureBrowserAuthSession } from "./session";
import { DEMO_ACADEMY_ID } from "../seed";
import type { AppState, HouseMembership, Role, Session } from "../types";
import { isUuid } from "./ids";

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
  "brand_logo",
  "brand_tagline",
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
    const quoted = [
      ...msg.matchAll(/'([^']+)' column/gi),
      ...msg.matchAll(/column\s+(?:[\w]+\.)?["']?(\w+)["']?/gi),
    ].map((m) => m[1]);
    const named = OPTIONAL_COLUMNS.filter((column) => msg.toLowerCase().includes(column));
    const drop = [...new Set([...quoted, ...named])].filter(Boolean);
    if (drop.length && /PGRST204|schema cache|could not find|does not exist|42703|column/i.test(msg)) {
      if (table === "attendance" && drop.includes("status")) {
        payload = payload.filter((row) => row.status !== "no_show");
      }
      payload = stripOptional(payload, drop);
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

type RemoteTableSnapshot = {
  academyId: string;
  revision: string;
  students: string[];
  classes: string[];
  attendance: string[];
  payments: string[];
  expenses: string[];
  inventory: string[];
  graduations: string[];
  evaluations: string[];
  posts: string[];
  events: string[];
  sales: string[];
  dropIns: string[];
};

let remoteSnapshot: RemoteTableSnapshot | null = null;

function idsOf(rows: { id: string }[]) {
  return rows.map((row) => row.id).filter((id) => isUuid(id));
}

export function rememberRemoteSnapshot(state: AppState) {
  remoteSnapshot = {
    academyId: state.academy.id,
    revision: state.academy.updatedAt || "",
    students: idsOf(state.students),
    classes: idsOf(state.classes),
    attendance: idsOf(state.attendance),
    payments: idsOf(state.payments),
    expenses: idsOf(state.expenses),
    inventory: idsOf(state.inventory),
    graduations: idsOf(state.graduations),
    evaluations: idsOf(state.evaluations ?? []),
    posts: idsOf(state.posts),
    events: idsOf(state.events ?? []),
    sales: idsOf(state.sales ?? []),
    dropIns: idsOf(state.dropIns ?? []),
  };
}

export function clearRemoteSnapshot() {
  remoteSnapshot = null;
}

function previousIds(table: keyof Omit<RemoteTableSnapshot, "academyId" | "revision">, academyId: string) {
  if (!remoteSnapshot || remoteSnapshot.academyId !== academyId) return [];
  return remoteSnapshot[table];
}

export async function listMyHouses(client?: SupabaseClient | null): Promise<HouseMembership[]> {
  const db = client ?? createSupabaseBrowserClient();
  if (!db) return [];
  const { data, error } = await db.rpc("list_my_academies");
  if (error) return [];
  return ((data ?? []) as Record<string, unknown>[])
    .map((row) => mapHouseMembership(row))
    .filter((row): row is HouseMembership => Boolean(row));
}

export async function switchRemoteHouse(academyId: string): Promise<AppState | { error: string }> {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "Não foi possível abrir a academia." };
  const { error } = await client.rpc("switch_academy", { p_academy_id: academyId });
  if (error) return { error: error.message };
  const { data: userData } = await client.auth.getUser();
  const user = userData.user;
  if (!user) return { error: "Entre de novo." };
  const { data: profile } = await client
    .from("profiles")
    .select("id, academy_id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.academy_id) return { error: "Academia não encontrada." };
  return pullAcademyState({
    userId: user.id,
    academyId: String(profile.academy_id),
    role: ((profile.role as Role | undefined) || "student") as Role,
  });
}

async function mergeHouseStaff(
  client: SupabaseClient,
  academyId: string,
  profiles: Record<string, unknown>[],
) {
  const staff = await client.rpc("list_house_staff");
  if (staff.error || !Array.isArray(staff.data)) return profiles;
  const byId = new Map(profiles.map((row) => [String(row.id), { ...row }]));
  for (const row of staff.data as Record<string, unknown>[]) {
    const id = String(row.id ?? "").trim();
    if (!id) continue;
    const prev = byId.get(id) ?? {};
    byId.set(id, { ...prev, ...row, academy_id: academyId, role: row.role });
  }
  return [...byId.values()];
}

function isMissingRelation(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const msg = error.message ?? "";
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /does not exist|schema cache|PGRST205|42P01/i.test(msg)
  );
}

/** Apaga só o que este aparelho já tinha baixado e o dono tirou. Linha nova de outro aparelho permanece. */
async function syncTable(
  client: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  previous: string[],
) {
  const keep = new Set(rows.map((r) => String(r.id)));
  const extra = previous.filter((id) => !keep.has(id));
  if (extra.length) {
    const { error } = await client.from(table).delete().in("id", extra);
    if (error && !isMissingRelation(error)) throw error;
  }
  await upsertRows(client, table, rows);
}

async function upsertJoin(
  client: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
) {
  if (!rows.length) return;
  const { error } = await client.from(table).upsert(rows);
  if (error) throw error;
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
    /* Presença do aluno vai por POST /api/aluno/presenca. Não reescreve a chamada da academia. */
    return { state: ready };
  }

  if (!remoteSnapshot || remoteSnapshot.academyId !== ready.academy.id) {
    return {
      error: "A academia ainda não carregou deste aparelho. Atualize a página.",
      needsPull: true as const,
      state: ready,
    };
  }

  const expectedRevision = remoteSnapshot.revision;
  const updateAcademy = async (payload: Record<string, unknown>) => {
    let query = client.from("academies").update(payload).eq("id", ready.academy.id);
    if (expectedRevision) query = query.eq("updated_at", expectedRevision);
    let { data, error } = await query.select("id, updated_at");
    if (error && expectedRevision && /updated_at|42703|schema cache|PGRST204/i.test(error.message)) {
      const retry = await client
        .from("academies")
        .update(payload)
        .eq("id", ready.academy.id)
        .select("id, updated_at");
      data = retry.data;
      error = retry.error;
    }
    return { data, error };
  };

  let { data: academyRows, error: academyError } = await updateAcademy(tables.academy);
  if (academyError && /join_code|duplicate|unique|23505/i.test(academyError.message) && remoteCode) {
    tables.academy.join_code = remoteCode;
    ({ data: academyRows, error: academyError } = await updateAcademy(tables.academy));
    if (academyError) return { error: academyError.message, state: ready };
    ready.academy.joinCode = remoteCode;
  } else if (academyError && /due_day|billing_status/i.test(academyError.message)) {
    const slim = { ...tables.academy };
    delete slim.due_day;
    delete slim.billing_status;
    ({ data: academyRows, error: academyError } = await updateAcademy(slim));
    if (academyError) return { error: academyError.message, state: ready };
  } else if (academyError) {
    return { error: academyError.message, state: ready };
  } else if (looksLikeHouseCode(localCode)) {
    ready.academy.joinCode = localCode;
  }

  if (expectedRevision && (!academyRows || academyRows.length === 0)) {
    return {
      error: "Esta ficha já foi alterada em outra aba. Recarregamos os dados.",
      conflict: true as const,
      state: ready,
    };
  }
  const touched = Array.isArray(academyRows) ? academyRows[0] : academyRows;
  const nextRevision = touched && typeof (touched as { updated_at?: unknown }).updated_at === "string"
    ? String((touched as { updated_at: string }).updated_at)
    : "";
  if (nextRevision) ready.academy.updatedAt = nextRevision;

  try {
    const academyId = ready.academy.id;
    await syncTable(client, "students", tables.students, previousIds("students", academyId));
    await syncTable(client, "classes", tables.classes, previousIds("classes", academyId));
    await syncTable(client, "attendance", tables.attendance, previousIds("attendance", academyId));
    await syncTable(client, "payments", tables.payments, previousIds("payments", academyId));
    await syncTable(client, "expenses", tables.expenses, previousIds("expenses", academyId));
    await syncTable(client, "inventory", tables.inventory, previousIds("inventory", academyId));
    await syncTable(client, "graduations", tables.graduations, previousIds("graduations", academyId));
    await syncTable(client, "evaluations", tables.evaluations, previousIds("evaluations", academyId));
    await syncTable(client, "posts", tables.posts, previousIds("posts", academyId));
    await upsertJoin(client, "post_likes", tables.postLikes);
    await syncTable(client, "events", tables.events, previousIds("events", academyId));
    await upsertJoin(client, "event_rsvps", tables.eventRsvps);
    await syncTable(client, "sales", tables.sales, previousIds("sales", academyId));
    await syncTable(client, "drop_ins", tables.dropIns, previousIds("dropIns", academyId));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Não foi possível salvar agora.";
    return { error: message, state: ready };
  }

  rememberRemoteSnapshot(ready);

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
      if ("conflict" in result && result.conflict) {
        window.dispatchEvent(new CustomEvent("jiupro-sync-conflict"));
        return;
      }
      if (result.error && !("missingAcademy" in result && result.missingAcademy) && !("needsPull" in result && result.needsPull)) {
        console.warn("TatameX: sync Supabase —", result.error);
      }
    });
  }, 350);
  return () => window.clearTimeout(handle);
}

const ACADEMY_MEMBER_COLUMNS =
  "id, name, slug, city, state, address, phone, instagram, pix_key, pix_name, plan, monthly_goal, drop_in_fee, due_day, join_code, brand_logo, brand_tagline, billing_status, created_at, updated_at";

async function loadAcademyRecord(
  client: SupabaseClient,
  academyId: string,
  isStudent: boolean,
) {
  if (isStudent) {
    const rpc = await client.rpc("academy_for_member");
    if (!rpc.error) {
      const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
      return { data: row ?? null, error: null };
    }
    if (!/PGRST202|does not exist|schema cache|42883/i.test(rpc.error.message)) {
      return { data: null, error: rpc.error };
    }
    const slim = await client
      .from("academies")
      .select(ACADEMY_MEMBER_COLUMNS)
      .eq("id", academyId)
      .maybeSingle();
    return slim;
  }
  return client.from("academies").select("*").eq("id", academyId).maybeSingle();
}

export async function pullAcademyState(session: Session): Promise<AppState | { error: string }> {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "Não foi possível abrir a academia." };
  const academyId = session.academyId;
  const isStudent = session.role === "student";
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
    houseRows,
  ] = await Promise.all([
    loadAcademyRecord(client, academyId, isStudent),
    client.from("profiles").select("*").eq("academy_id", academyId),
    client.from("students").select("*").eq("academy_id", academyId),
    client.from("classes").select("*").eq("academy_id", academyId),
    client.from("attendance").select("*").eq("academy_id", academyId),
    client.from("payments").select("*").eq("academy_id", academyId),
    isStudent
      ? Promise.resolve({ data: [], error: null })
      : client.from("expenses").select("*").eq("academy_id", academyId),
    isStudent
      ? Promise.resolve({ data: [], error: null })
      : client.from("inventory").select("*").eq("academy_id", academyId),
    client.from("graduations").select("*").eq("academy_id", academyId),
    client.from("evaluations").select("*").eq("academy_id", academyId),
    client.from("posts").select("*").eq("academy_id", academyId),
    client.from("events").select("*").eq("academy_id", academyId),
    isStudent
      ? Promise.resolve({ data: [], error: null })
      : client.from("sales").select("*").eq("academy_id", academyId),
    isStudent
      ? Promise.resolve({ data: [], error: null })
      : client.from("drop_ins").select("*").eq("academy_id", academyId),
    listMyHouses(client),
  ]);

  if (academy.error) return { error: academy.error.message };
  if (!academy.data) return { error: "Academia não encontrada." };

  const required: Array<[string, { error: { message: string } | null }]> = [
    ["alunos", students],
    ["turmas", classes],
    ["presença", attendance],
    ["cobranças", payments],
    ["graduações", graduations],
    ["avaliações", evaluations],
    ["mural", posts],
    ["agenda", events],
  ];
  if (!isStudent) {
    required.push(
      ["lançamentos", expenses],
      ["estoque", inventory],
      ["vendas", sales],
      ["experimentais avulsos", dropIns],
    );
  }
  for (const [label, result] of required) {
    if (result.error && !isMissingRelation(result.error)) {
      return { error: `Não deu para ler ${label}: ${result.error.message}` };
    }
  }
  if (profiles.error && !isMissingRelation(profiles.error)) {
    return { error: profiles.error.message };
  }

  const profileRows = isStudent
    ? ((profiles.data ?? []) as Record<string, unknown>[])
    : await mergeHouseStaff(client, academyId, (profiles.data ?? []) as Record<string, unknown>[]);

  const postIds = (posts.data ?? []).map((p: { id: string }) => String(p.id));
  const eventIds = (events.data ?? []).map((e: { id: string }) => String(e.id));
  const postLikes = postIds.length
    ? await client.from("post_likes").select("*").in("post_id", postIds)
    : { data: [], error: null };
  const eventRsvps = eventIds.length
    ? await client.from("event_rsvps").select("*").in("event_id", eventIds)
    : { data: [], error: null };

  if (postLikes.error && !isMissingRelation(postLikes.error)) {
    return { error: postLikes.error.message };
  }
  if (eventRsvps.error && !isMissingRelation(eventRsvps.error)) {
    return { error: eventRsvps.error.message };
  }

  let studentRows = (students.data ?? []) as Record<string, unknown>[];
  if (isStudent) {
    const directory = await client.rpc("student_class_directory");
    if (directory.error && !isMissingRelation(directory.error) && !/PGRST202|does not exist/i.test(directory.error.message)) {
      return { error: directory.error.message };
    }
    const mine = new Map(studentRows.map((row) => [String(row.id), row]));
    for (const row of (directory.data ?? []) as Record<string, unknown>[]) {
      const id = String(row.id ?? "");
      if (!id || mine.has(id)) continue;
      mine.set(id, {
        id,
        academy_id: academyId,
        name: row.name,
        belt: row.belt,
        stripes: row.stripes,
        division: row.division,
        status: row.status,
        avatar_hue: row.avatar_hue,
        email: "",
        phone: "",
        monthly_fee: 0,
        notes: "",
      });
    }
    studentRows = [...mine.values()];
  }

  return tablesToState({
    academy: academy.data,
    profiles: profileRows,
    students: studentRows,
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
    houses: houseRows.length
      ? houseRows
      : [
          {
            id: academyId,
            name: String((academy.data as { name?: string }).name ?? ""),
            slug: String((academy.data as { slug?: string }).slug ?? ""),
            city: String((academy.data as { city?: string }).city ?? ""),
            state: String((academy.data as { state?: string }).state ?? ""),
            role: session.role,
          },
        ],
  });
}

export async function resumeRemoteSession(
  hint?: Session | null,
): Promise<AppState | { error: string } | null> {
  const client = createSupabaseBrowserClient();
  if (!client) return null;
  const first = (await client.auth.getSession()).data.session;
  if (!first && !hint) return null;
  const token = first?.access_token ?? (await ensureBrowserAuthSession(client));
  if (!token) return null;
  const { data: userData } = await client.auth.getUser();
  const user = userData.user;
  if (!user) return null;
  const { data: profile, error } = await client
    .from("profiles")
    .select("id, academy_id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (error && !isMissingRelation(error)) return { error: error.message };
  const academyId = (profile?.academy_id as string | undefined) || hint?.academyId;
  if (!academyId) return null;
  return pullAcademyState({
    userId: user.id,
    academyId,
    role: ((profile?.role as Role | undefined) || hint?.role || "owner") as Role,
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

type ProvisionIntent = {
  intent: "cadastro" | "aluno";
  academyName?: string;
  ownerName?: string;
  house?: string;
  captchaToken?: string;
};

async function provisionAndSignIn(email: string, password: string, extra: ProvisionIntent) {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "offline" as const };

  const guard = await fetch("/api/auth/guard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "signup", email }),
  }).catch(() => null);
  if (guard?.status === 429) {
    return { error: "Muitas tentativas. Espere um pouco e tente de novo." };
  }

  const provisioned = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      captchaToken: extra.captchaToken,
      intent: extra.intent,
      academyName: extra.academyName,
      ownerName: extra.ownerName,
      house: extra.house,
    }),
  }).catch(() => null);
  const payload = provisioned
    ? ((await provisioned.json().catch(() => ({}))) as { error?: string })
    : {};

  if (provisioned && provisioned.status === 429) {
    return { error: payload.error || "Muitas tentativas. Espere um pouco e tente de novo." };
  }
  if (provisioned && provisioned.status === 400 && payload.error) {
    return { error: mapAuthError(payload.error) };
  }
  if (provisioned && provisioned.status === 403) {
    return { error: mapAuthError(payload.error || "Origem não permitida.") };
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
  captchaToken?: string;
}): Promise<{ academyId?: string; ownerId?: string; error?: string; pendingEmail?: boolean }> {
  const auth = await provisionAndSignIn(input.email, input.password, {
    intent: "cadastro",
    academyName: input.name,
    ownerName: input.ownerName,
    captchaToken: input.captchaToken,
  });
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

  const guard = await fetch("/api/auth/guard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", email }),
  }).catch(() => null);
  if (guard?.status === 429) {
    return { error: "Muitas tentativas. Espere um pouco e tente de novo." };
  }

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
    const created = await provisionAndSignIn(input.email, input.password, {
      intent: "cadastro",
      academyName: input.state.academy.name,
      ownerName:
        input.state.users.find((u) => u.role === "owner")?.name ?? input.state.academy.name,
    });
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
  const guard = await fetch("/api/auth/guard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reset", email }),
  }).catch(() => null);
  if (guard?.status === 429) {
    return { error: "Muitas tentativas. Espere um pouco e tente de novo." };
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
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const code = params.get("code");
  const tokenHash = params.get("token_hash") || hash.get("token_hash");
  const type = (params.get("type") || hash.get("type") || "").toLowerCase();
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  const isRecovery =
    type === "recovery" || Boolean(tokenHash) || Boolean(code) || Boolean(accessToken);

  if (!isRecovery) {
    return { error: "Este link é inválido ou já foi usado. Peça outro e-mail." };
  }

  if (tokenHash) {
    await client.auth.signOut({ scope: "local" });
    const { error } = await client.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    if (error) return { error: "Este link expirou ou já foi usado. Peça outro." };
  } else if (accessToken && (type === "recovery" || hash.get("type") === "recovery")) {
    await client.auth.signOut({ scope: "local" });
    const { error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || "",
    });
    if (error) return { error: "Este link expirou ou já foi usado. Peça outro." };
  } else if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) return { error: "Este link expirou ou já foi usado. Peça outro." };
  } else {
    return { error: "Este link é inválido ou já foi usado. Peça outro e-mail." };
  }

  const session = (await client.auth.getSession()).data.session;
  if (session?.user) {
    return { email: session.user.email ?? "" };
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
  birthDate?: string;
  guardianName?: string;
  division?: "adult" | "kids";
  captchaToken?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const houseLabel = (input.houseName || input.code || input.slug || "aluno").trim();
  const auth = await provisionAndSignIn(email, input.password, {
    intent: "aluno",
    house: houseLabel,
    captchaToken: input.captchaToken,
  });
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
        birthDate: input.birthDate,
        guardianName: input.guardianName,
        division: input.division,
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
      p_birth_date: input.birthDate || null,
      p_guardian_name: input.guardianName || null,
      p_division: input.division || null,
    });
    if (rpc.error && /PGRST202|argument|schema cache/i.test(rpc.error.message)) {
      const fallback = await client.rpc("join_academy_as_student", {
        p_code: resolved.code,
        p_name: input.name,
        p_phone: input.phone,
      });
      if (!fallback.error && fallback.data) {
        return {
          session: {
            userId: accessUser.id,
            academyId: String(fallback.data),
            role: "student" as const,
          } satisfies Session,
        };
      }
      if (fallback.error && !isStudentJoinNotFound(fallback.error.message)) {
        return { error: fallback.error.message };
      }
    } else if (!rpc.error && rpc.data) {
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
