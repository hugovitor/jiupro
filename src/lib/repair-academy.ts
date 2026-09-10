import type { SupabaseClient } from "@supabase/supabase-js";
import {
  findMatchingHouses,
  pickCanonicalHouse,
  type HouseRow,
} from "@/lib/academy-canonical";
import { isOperatorEmail } from "@/lib/operator";
import { ensureStudentRosterRow } from "@/lib/student-enroll";

const CHILD_TABLES = [
  "classes",
  "attendance",
  "payments",
  "expenses",
  "inventory",
  "graduations",
  "evaluations",
  "posts",
  "events",
  "sales",
  "drop_ins",
] as const;

type ProfileRow = {
  id: string;
  academy_id: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  phone: string | null;
  created_at?: string | null;
};

type StudentRow = {
  id: string;
  academy_id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
};

function digits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function createdMs(value: string | null | undefined) {
  const raw = value ? Date.parse(value) : NaN;
  return Number.isFinite(raw) ? raw : Number.MAX_SAFE_INTEGER;
}

function asHouse(row: Record<string, unknown>): HouseRow {
  return {
    id: String(row.id),
    name: (row.name as string | null) ?? null,
    slug: (row.slug as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    join_code: (row.join_code as string | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
  };
}

async function loadHouses(admin: SupabaseClient) {
  const { data, error } = await admin
    .from("academies")
    .select("id, name, slug, city, state, join_code, created_at")
    .order("created_at", { ascending: true })
    .limit(400);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => asHouse(row as Record<string, unknown>));
}

async function ownersToKeep(
  admin: SupabaseClient,
  academyIds: string[],
): Promise<Set<string>> {
  const keep = new Set<string>();
  const { data } = await admin
    .from("profiles")
    .select("id, academy_id, email, role, created_at")
    .in("academy_id", academyIds)
    .eq("role", "owner");
  const rows = (data ?? []) as ProfileRow[];
  for (const academyId of academyIds) {
    const oldest = rows
      .filter((row) => row.academy_id === academyId)
      .sort((a, b) => createdMs(a.created_at) - createdMs(b.created_at))[0];
    if (oldest?.id) keep.add(oldest.id);
  }
  for (const row of rows) {
    if (isOperatorEmail(row.email)) keep.add(row.id);
  }
  return keep;
}

async function moveChildren(admin: SupabaseClient, fromId: string, toId: string) {
  for (const table of CHILD_TABLES) {
    await admin.from(table).update({ academy_id: toId }).eq("academy_id", fromId);
  }
}

async function mergeStudents(admin: SupabaseClient, fromId: string, toId: string) {
  const { data: incoming } = await admin
    .from("students")
    .select("id, academy_id, user_id, name, email, phone")
    .eq("academy_id", fromId);
  const { data: existing } = await admin
    .from("students")
    .select("id, academy_id, user_id, name, email, phone")
    .eq("academy_id", toId);

  const roster = (existing ?? []) as StudentRow[];
  for (const row of (incoming ?? []) as StudentRow[]) {
    const email = (row.email ?? "").trim().toLowerCase();
    const phone = digits(row.phone);
    const hit = roster.find((other) => {
      const otherEmail = (other.email ?? "").trim().toLowerCase();
      const otherPhone = digits(other.phone);
      if (email && otherEmail && email === otherEmail) return true;
      if (phone.length >= 10 && otherPhone.length >= 10) {
        return otherPhone === phone || otherPhone === `55${phone}` || `55${otherPhone}` === phone;
      }
      if (row.user_id && other.user_id && row.user_id === other.user_id) return true;
      return false;
    });
    if (hit) {
      if (!hit.user_id && row.user_id) {
        await admin.from("students").update({ user_id: row.user_id }).eq("id", hit.id);
        hit.user_id = row.user_id;
      }
      await admin.from("students").delete().eq("id", row.id);
    } else {
      await admin.from("students").update({ academy_id: toId }).eq("id", row.id);
      roster.push({ ...row, academy_id: toId });
    }
  }
}

async function backfillStudents(admin: SupabaseClient, academyId: string) {
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, academy_id, name, email, role, phone")
    .eq("academy_id", academyId)
    .eq("role", "student");
  for (const profile of (profiles ?? []) as ProfileRow[]) {
    await ensureStudentRosterRow(admin, {
      academyId,
      userId: profile.id,
      email: profile.email ?? "",
      name: profile.name ?? "",
      phone: profile.phone ?? "",
    });
  }
}

async function demoteExtraOwners(
  admin: SupabaseClient,
  academyId: string,
  keepIds: Set<string>,
) {
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, academy_id, name, email, role, phone")
    .eq("academy_id", academyId)
    .eq("role", "owner");
  for (const profile of (profiles ?? []) as ProfileRow[]) {
    if (keepIds.has(profile.id)) continue;
    await admin.from("profiles").update({ role: "student" }).eq("id", profile.id);
    await ensureStudentRosterRow(admin, {
      academyId,
      userId: profile.id,
      email: profile.email ?? "",
      name: profile.name ?? "",
      phone: profile.phone ?? "",
    });
  }
}

export async function repairAcademyHouse(
  admin: SupabaseClient,
  input: {
    academyId: string;
    name?: string;
    slug?: string;
    city?: string;
    joinCode?: string;
  },
): Promise<{ academyId: string; merged: number }> {
  const houses = await loadHouses(admin);
  const current = houses.find((row) => row.id === input.academyId);
  const needle = {
    joinCode: input.joinCode || current?.join_code || undefined,
    slug: input.slug || current?.slug || undefined,
    name: input.name || current?.name || undefined,
    city: input.city || current?.city || undefined,
  };
  const cluster = findMatchingHouses(houses, needle);
  const withCurrent = cluster.some((row) => row.id === input.academyId)
    ? cluster
    : current
      ? [...cluster, current]
      : cluster;
  const canonical = pickCanonicalHouse(withCurrent) ?? current;
  if (!canonical) return { academyId: input.academyId, merged: 0 };

  const duplicates = withCurrent.filter((row) => row.id !== canonical.id);
  const keepOwners = await ownersToKeep(admin, withCurrent.map((row) => row.id));

  for (const dup of duplicates) {
    await admin.from("profiles").update({ academy_id: canonical.id }).eq("academy_id", dup.id);
    await mergeStudents(admin, dup.id, canonical.id);
    await moveChildren(admin, dup.id, canonical.id);
    const removed = await admin.from("academies").delete().eq("id", dup.id);
    if (removed.error) {
      await admin
        .from("academies")
        .update({
          slug: `arquivo-${dup.id.replace(/-/g, "").slice(0, 10)}`,
          name: `arquivo-${dup.id.slice(0, 8)}`,
          join_code: `X${dup.id.replace(/-/g, "").slice(0, 5).toUpperCase()}`.slice(0, 6),
        })
        .eq("id", dup.id);
    }
  }

  await demoteExtraOwners(admin, canonical.id, keepOwners);
  await backfillStudents(admin, canonical.id);

  return { academyId: canonical.id, merged: duplicates.length };
}

export async function findReusableAcademy(
  admin: SupabaseClient,
  needle: { joinCode?: string; slug?: string; name?: string; city?: string },
) {
  const houses = await loadHouses(admin);
  return pickCanonicalHouse(findMatchingHouses(houses, needle));
}
