import type { SupabaseClient } from "@supabase/supabase-js";
import { collapseAcademyKey, generateJoinCode, looksLikeHouseCode } from "@/lib/join-code";
import { mapPublicHouse, STUDENT_JOIN_NOT_FOUND, type PublicAcademyJoin } from "@/lib/student-join";

const HOUSE_COLUMNS = "id, name, slug, city, state, join_code";

export type AcademyHit = {
  id: string;
  name: string | null;
  slug: string | null;
  city: string | null;
  state: string | null;
  join_code: string | null;
};

export type JoinHouseInput = {
  code?: string;
  slug?: string;
  houseName?: string;
};

function needles(input: JoinHouseInput) {
  return [input.code, input.slug, input.houseName]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean);
}

function scoreHouse(row: AcademyHit, raw: string) {
  const key = collapseAcademyKey(raw);
  const nameKey = collapseAcademyKey(row.name ?? "");
  const slugKey = collapseAcademyKey(row.slug ?? "");
  const cityKey = collapseAcademyKey(row.city ?? "");
  const code = (row.join_code ?? "").trim().toUpperCase();
  const needleCode = raw.trim().toUpperCase();
  if (looksLikeHouseCode(raw)) {
    if (code && code === needleCode) return 0;
    if ((row.slug ?? "").toLowerCase() === raw.trim().toLowerCase()) return 1;
    return 99;
  }
  if (code && code === needleCode) return 0;
  if ((row.slug ?? "").toLowerCase() === raw.trim().toLowerCase()) return 1;
  if (slugKey && slugKey === key) return 1;
  if ((row.name ?? "").trim().toLowerCase() === raw.trim().toLowerCase()) return 2;
  if (nameKey && nameKey === key) return 2;
  if (key.length >= 2 && (nameKey.startsWith(key) || nameKey.includes(key))) return 3;
  if (key.length >= 2 && cityKey.includes(key)) return 4;
  return 99;
}

async function loadHouses(admin: SupabaseClient) {
  const full = await admin.from("academies").select(HOUSE_COLUMNS).order("name").limit(400);
  if (!full.error) return { rows: (full.data ?? []) as AcademyHit[] };
  if (!/join_code|column/i.test(full.error.message)) {
    return { error: full.error.message, rows: [] as AcademyHit[] };
  }
  const fallback = await admin
    .from("academies")
    .select("id, name, slug, city, state")
    .order("name")
    .limit(400);
  if (fallback.error) return { error: fallback.error.message, rows: [] as AcademyHit[] };
  return { rows: (fallback.data ?? []) as AcademyHit[] };
}

export function rankHouses(rows: AcademyHit[], query: string): AcademyHit[] {
  const needle = query.trim();
  if (needle.length < 2) return [];
  return rows
    .map((row) => ({ row, score: scoreHouse(row, needle) }))
    .filter((item) => item.score < 99)
    .sort((a, b) => a.score - b.score || (a.row.name ?? "").localeCompare(b.row.name ?? ""))
    .map((item) => item.row);
}

function safeIlike(value: string) {
  return `%${value.trim().replace(/\\/g, "").replace(/[%_]/g, "")}%`;
}

export async function searchAcademiesAdmin(admin: SupabaseClient, query: string) {
  const needle = query.trim();
  if (needle.length < 2) return { houses: [] as PublicAcademyJoin[] };

  const hits = new Map<string, AcademyHit>();
  const add = (rows: AcademyHit[] | null | undefined) => {
    for (const row of rows ?? []) {
      if (row?.id) hits.set(String(row.id), row);
    }
  };

  const pattern = safeIlike(needle);
  const spaced = safeIlike(needle.replace(/\s+/g, "%"));
  const columns = ["name", "slug", "city"] as const;
  for (const column of columns) {
    const direct = await admin.from("academies").select(HOUSE_COLUMNS).ilike(column, pattern).limit(20);
    if (!direct.error) add(direct.data as AcademyHit[]);
    if (spaced !== pattern) {
      const loose = await admin.from("academies").select(HOUSE_COLUMNS).ilike(column, spaced).limit(20);
      if (!loose.error) add(loose.data as AcademyHit[]);
    }
  }
  if (looksLikeHouseCode(needle)) {
    const byCode = await admin.from("academies").select(HOUSE_COLUMNS).eq("join_code", needle.toUpperCase()).limit(5);
    if (!byCode.error) add(byCode.data as AcademyHit[]);
  }
  for (const token of needle.split(/\s+/).filter((part) => part.length >= 2)) {
    const byToken = await admin.from("academies").select(HOUSE_COLUMNS).ilike("name", safeIlike(token)).limit(20);
    if (!byToken.error) add(byToken.data as AcademyHit[]);
  }

  if (!hits.size) {
    const loaded = await loadHouses(admin);
    if (loaded.error) return { error: loaded.error, houses: [] as PublicAcademyJoin[] };
    add(loaded.rows);
  }

  const ranked = rankHouses([...hits.values()], needle).slice(0, 8);
  return {
    houses: ranked.map((row) => mapPublicHouse(row as unknown as Record<string, unknown>)),
  };
}

async function pickExact(admin: SupabaseClient, column: "slug" | "join_code" | "name", value: string) {
  const query = admin.from("academies").select(HOUSE_COLUMNS).limit(5);
  const { data, error } =
    column === "join_code"
      ? await query.eq("join_code", value.toUpperCase())
      : await query.ilike(column, value);
  if (error || !data?.length) return null;
  const rows = data as AcademyHit[];
  return rows.find((row) => scoreHouse(row, value) <= 2) ?? (rows.length === 1 ? rows[0] : null);
}

export async function resolveAcademy(admin: SupabaseClient, input: JoinHouseInput) {
  const slug = input.slug?.trim() ?? "";
  const code = input.code?.trim() ?? "";
  const houseName = input.houseName?.trim() ?? "";

  if (slug) {
    const hit = await pickExact(admin, "slug", slug);
    if (hit) return { academy: hit };
  }
  if (looksLikeHouseCode(code)) {
    const hit = await pickExact(admin, "join_code", code);
    if (hit) return { academy: hit };
  }
  if (houseName) {
    const hit = await pickExact(admin, "name", houseName);
    if (hit) return { academy: hit };
  }

  const loaded = await loadHouses(admin);
  if (loaded.error) return { error: loaded.error };
  const rows = loaded.rows;
  if (!rows.length) return { error: STUDENT_JOIN_NOT_FOUND };

  for (const needle of needles(input)) {
    const ranked = rankHouses(rows, needle);
    const exact = ranked.find((row) => scoreHouse(row, needle) <= 2) ?? (ranked.length === 1 ? ranked[0] : undefined);
    if (exact) return { academy: exact };
  }

  const combined = needles(input).join(" ");
  if (combined.trim().length >= 2) {
    const ranked = rankHouses(rows, combined);
    if (ranked.length === 1) return { academy: ranked[0] };
  }

  return { error: STUDENT_JOIN_NOT_FOUND };
}

function firstRow(data: unknown) {
  if (Array.isArray(data)) return data[0] as Record<string, unknown> | undefined;
  if (data && typeof data === "object") return data as Record<string, unknown>;
  return undefined;
}

export async function resolveHouseViaJoinRpc(db: SupabaseClient, input: JoinHouseInput) {
  const queries = [input.slug, input.houseName, input.code]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean);
  for (const query of queries) {
    const lookup = await db.rpc("lookup_academy_join", { p_code: query });
    const row = firstRow(lookup.data);
    if (row) return mapPublicHouse(row);
  }

  const searchQuery = input.houseName || input.slug || input.code || "";
  if (searchQuery.trim().length < 2) return null;
  const search = await db.rpc("search_academy_join", { p_query: searchQuery.trim() });
  const rows = Array.isArray(search.data) ? search.data : search.data ? [search.data] : [];
  const houses = rows.map((row) => mapPublicHouse(row as Record<string, unknown>));
  const nameKey = collapseAcademyKey(input.houseName || searchQuery);
  const slugKey = collapseAcademyKey(input.slug || searchQuery);
  const exact =
    houses.find((house) => collapseAcademyKey(house.name) === nameKey) ||
    houses.find((house) => collapseAcademyKey(house.slug) === slugKey) ||
    (houses.length === 1 ? houses[0] : undefined);
  return exact ?? null;
}

async function ensureJoinCode(admin: SupabaseClient, academy: AcademyHit) {
  const current = academy.join_code?.trim() ?? "";
  if (current) return current;
  for (let i = 0; i < 8; i++) {
    const next = generateJoinCode();
    const { error } = await admin.from("academies").update({ join_code: next }).eq("id", academy.id);
    if (!error) {
      academy.join_code = next;
      return next;
    }
  }
  return academy.slug ?? "";
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export async function enrollStudentInAcademy(
  admin: SupabaseClient,
  input: {
    userId: string;
    email: string;
    studentName: string;
    phone: string;
    house: JoinHouseInput;
  },
): Promise<{ academyId: string } | { error: string; status: number }> {
  const resolved = await resolveAcademy(admin, input.house);
  if (!("academy" in resolved) || !resolved.academy) {
    return { error: ("error" in resolved && resolved.error) || STUDENT_JOIN_NOT_FOUND, status: 400 };
  }
  const academy = resolved.academy;
  await ensureJoinCode(admin, academy);
  const offered = (input.house.code ?? "").trim().toUpperCase();
  if (
    looksLikeHouseCode(offered) &&
    (academy.join_code ?? "").trim().toUpperCase() !== offered
  ) {
    const taken = await admin.from("academies").select("id").eq("join_code", offered).maybeSingle();
    if (!taken.data) {
      const { error } = await admin.from("academies").update({ join_code: offered }).eq("id", academy.id);
      if (!error) academy.join_code = offered;
    }
  }

  const email = input.email.trim().toLowerCase();
  const label = input.studentName.trim() || email.split("@")[0] || "Aluno";
  const phone = input.phone.trim();
  const digits = phoneDigits(phone);

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, academy_id, role, name, email, phone")
    .eq("id", input.userId)
    .maybeSingle();
  if (profileError) return { error: profileError.message, status: 400 };

  if (profile) {
    if (profile.role && profile.role !== "student") {
      return {
        error: "Este e-mail já é da equipe da academia. Use outro e-mail no app do aluno.",
        status: 400,
      };
    }
    if (profile.academy_id && profile.academy_id !== academy.id) {
      return {
        error: "Este e-mail já pertence a outra academia. Use outro e-mail no app do aluno.",
        status: 400,
      };
    }
    if (profile.academy_id === academy.id) {
      return { academyId: academy.id };
    }
  }

  let studentId: string | null = null;
  let claimed: string | null = null;

  const { data: roster } = await admin
    .from("students")
    .select("id, user_id, email, phone, created_at")
    .eq("academy_id", academy.id)
    .order("created_at", { ascending: true })
    .limit(500);

  const emailHit = email
    ? (roster ?? []).find((row) => String(row.email ?? "").trim().toLowerCase() === email)
    : undefined;
  if (emailHit?.id) {
    studentId = String(emailHit.id);
    claimed = emailHit.user_id ? String(emailHit.user_id) : null;
  }

  if (!studentId && digits.length >= 10) {
    const hit = (roster ?? []).find((row) => {
      const phoneKey = phoneDigits(String(row.phone ?? ""));
      if (phoneKey.length < 10) return false;
      return phoneKey === digits || phoneKey === `55${digits}` || `55${phoneKey}` === digits;
    });
    if (hit?.id) {
      studentId = String(hit.id);
      claimed = hit.user_id ? String(hit.user_id) : null;
    }
  }

  if (claimed && claimed !== input.userId) {
    return {
      error: "Essa ficha já tem acesso. Entre com o e-mail e a senha que você criou.",
      status: 400,
    };
  }

  if (profile) {
    const { error } = await admin
      .from("profiles")
      .update({
        academy_id: academy.id,
        role: "student",
        name: profile.name || label,
        email: profile.email || email,
        phone: profile.phone || phone || null,
      })
      .eq("id", input.userId);
    if (error) return { error: error.message, status: 400 };
  } else {
    const { error } = await admin.from("profiles").insert({
      id: input.userId,
      academy_id: academy.id,
      name: label,
      role: "student",
      email,
      phone: phone || null,
    });
    if (error) return { error: error.message, status: 400 };
  }

  if (studentId) {
    const { error } = await admin
      .from("students")
      .update({
        user_id: input.userId,
        email: email || undefined,
        phone: phone || undefined,
      })
      .eq("id", studentId);
    if (error) return { error: error.message, status: 400 };
  } else {
    const { error } = await admin.from("students").insert({
      academy_id: academy.id,
      user_id: input.userId,
      name: label,
      email: email || null,
      phone: phone || null,
      division: "adult",
      belt: "white",
      status: "active",
      monthly_fee: 0,
    });
    if (error) return { error: error.message, status: 400 };
  }

  return { academyId: academy.id };
}
