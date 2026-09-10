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
  if (code && code === needleCode) return 0;
  if (looksLikeHouseCode(raw) && code === needleCode) return 0;
  if ((row.slug ?? "").toLowerCase() === raw.trim().toLowerCase()) return 1;
  if (slugKey && slugKey === key) return 1;
  if ((row.name ?? "").trim().toLowerCase() === raw.trim().toLowerCase()) return 2;
  if (nameKey && nameKey === key) return 2;
  if (key.length >= 2 && (nameKey.startsWith(key) || nameKey.includes(key))) return 3;
  if (key.length >= 2 && cityKey.includes(key)) return 4;
  return 99;
}

async function loadHouses(admin: SupabaseClient) {
  const { data, error } = await admin
    .from("academies")
    .select(HOUSE_COLUMNS)
    .order("name")
    .limit(400);
  if (error) return { error: error.message, rows: [] as AcademyHit[] };
  return { rows: (data ?? []) as AcademyHit[] };
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

export async function searchAcademiesAdmin(admin: SupabaseClient, query: string) {
  const loaded = await loadHouses(admin);
  if (loaded.error) return { error: loaded.error, houses: [] as PublicAcademyJoin[] };
  const houses = rankHouses(loaded.rows, query)
    .slice(0, 8)
    .map((row) => mapPublicHouse(row as unknown as Record<string, unknown>));
  return { houses };
}

export async function resolveAcademy(admin: SupabaseClient, input: JoinHouseInput) {
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
