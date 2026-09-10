import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/operator";
import {
  STUDENT_JOIN_NOT_FOUND,
  STUDENT_JOIN_SETUP_ERROR,
} from "@/lib/student-join";
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

  return {
    house: {
      name: String(row.name ?? ""),
      city: String(row.city ?? ""),
      state: String(row.state ?? ""),
      slug: String(row.slug ?? ""),
      joinCode: String(row.join_code ?? casa).toUpperCase(),
    },
  };
}

export async function GET(request: Request) {
  const casa = new URL(request.url).searchParams.get("casa")?.trim() ?? "";
  if (!casa) {
    return NextResponse.json({ error: "Informe o código da casa." }, { status: 400 });
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
