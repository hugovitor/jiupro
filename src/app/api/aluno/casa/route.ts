import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/operator";
import {
  mapPublicHouse,
  STUDENT_JOIN_NOT_FOUND,
  STUDENT_JOIN_SETUP_ERROR,
  type PublicAcademyJoin,
} from "@/lib/student-join";
import { searchAcademiesAdmin } from "@/lib/student-enroll";
import {
  ensureStudentJoinSchema,
  isMissingStudentJoinRpc,
} from "@/lib/supabase/ensure-student-join";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return supabaseAdmin() ?? (url && anon ? createClient(url, anon, { auth: { persistSession: false } }) : null);
}

async function lookupHouse(casa: string) {
  const admin = supabaseAdmin();
  if (admin) {
    const found = await searchAcademiesAdmin(admin, casa);
    if (found.error) return { error: found.error, status: 400 as const };
    if (found.houses[0]) return { house: found.houses[0] };
  }

  const db = dbClient();
  if (!db) return { error: STUDENT_JOIN_NOT_FOUND, status: 404 as const };

  let { data, error } = await db.rpc("lookup_academy_join", { p_code: casa });
  if (error && isMissingStudentJoinRpc(error.message)) {
    const ensured = await ensureStudentJoinSchema();
    if (ensured.ok) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      ({ data, error } = await db.rpc("lookup_academy_join", { p_code: casa }));
    }
    if (error && isMissingStudentJoinRpc(error.message)) {
      return { error: STUDENT_JOIN_SETUP_ERROR, status: 409 as const, needsSetup: true };
    }
  }

  if (error) return { error: error.message, status: 400 as const };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { error: STUDENT_JOIN_NOT_FOUND, status: 404 as const };

  return { house: mapPublicHouse(row as Record<string, unknown>) };
}

async function searchHouses(query: string) {
  const admin = supabaseAdmin();
  if (admin) {
    const found = await searchAcademiesAdmin(admin, query);
    if (!found.error) return { houses: found.houses };
  }

  const db = dbClient();
  if (!db) return { houses: [] as PublicAcademyJoin[] };

  let { data, error } = await db.rpc("search_academy_join", { p_query: query });
  if (error && isMissingStudentJoinRpc(error.message)) {
    const ensured = await ensureStudentJoinSchema();
    if (ensured.ok) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      ({ data, error } = await db.rpc("search_academy_join", { p_query: query }));
    }
    if (error && isMissingStudentJoinRpc(error.message)) {
      const one = await lookupHouse(query);
      if ("house" in one) return { houses: [one.house] };
      return { houses: [] as PublicAcademyJoin[] };
    }
  }
  if (error) return { error: error.message, status: 400 as const };

  const rows = Array.isArray(data) ? data : data ? [data] : [];
  return {
    houses: rows.map((row) => mapPublicHouse(row as Record<string, unknown>)),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const casa = url.searchParams.get("casa")?.trim() ?? "";
  const q = url.searchParams.get("q")?.trim() ?? "";

  if (q) {
    const result = await searchHouses(q);
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }
    return NextResponse.json({ ok: true, houses: result.houses });
  }

  if (!casa) {
    return NextResponse.json({ error: "Informe o nome ou o código da academia." }, { status: 400 });
  }

  const result = await lookupHouse(casa);
  if ("house" in result) {
    return NextResponse.json({ ok: true, house: result.house });
  }
  return NextResponse.json(
    {
      error: result.error,
      ...(result.needsSetup ? { needsSetup: true } : {}),
    },
    { status: result.status },
  );
}

export async function POST() {
  const result = await ensureStudentJoinSchema();
  if (result.ok) return NextResponse.json({ ok: true, applied: result.applied });
  return NextResponse.json(
    { error: STUDENT_JOIN_SETUP_ERROR, needsSetup: true },
    { status: result.reason === "missing-uri" ? 503 : 502 },
  );
}
