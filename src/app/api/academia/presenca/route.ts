import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isoDate } from "@/lib/format";
import { supabaseAdmin } from "@/lib/operator";
import { classFingerprint } from "@/lib/roster-identity";
import {
  ensureAttendanceSchema,
  isMissingAttendanceStatusColumn,
} from "@/lib/supabase/ensure-attendance-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.replace(/^Bearer\s+/i, "").trim();
}

async function userFromToken(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return null;
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.id) return null;
  return data.user;
}

function timeValue(raw: string) {
  const hm = String(raw ?? "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (!hm) return "";
  return `${hm[1].padStart(2, "0")}:${hm[2]}`;
}

function slotIdsFor(
  classes: { id: unknown; weekday?: unknown; start_time?: unknown; name?: unknown; division?: unknown }[],
  classId: string,
) {
  const hit = classes.find((row) => String(row.id) === classId);
  if (!hit) return [classId];
  const print = classFingerprint({
    weekday: Number(hit.weekday),
    startTime: String(hit.start_time ?? ""),
    name: String(hit.name ?? ""),
    division: (String(hit.division ?? "adult") as "adult" | "kids" | "mixed") || "adult",
  });
  const time = timeValue(String(hit.start_time ?? ""));
  return classes
    .filter((row) => {
      if (String(row.id) === classId) return true;
      const other = classFingerprint({
        weekday: Number(row.weekday),
        startTime: String(row.start_time ?? ""),
        name: String(row.name ?? ""),
        division: (String(row.division ?? "adult") as "adult" | "kids" | "mixed") || "adult",
      });
      if (other === print) return true;
      return (
        Number(row.weekday) === Number(hit.weekday) &&
        timeValue(String(row.start_time ?? "")) === time &&
        String(row.division ?? "adult") === String(hit.division ?? "adult")
      );
    })
    .map((row) => String(row.id));
}

export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) return NextResponse.json({ error: "Entre de novo." }, { status: 401 });
  const user = await userFromToken(token);
  if (!user) return NextResponse.json({ error: "Sessão expirada. Entre de novo." }, { status: 401 });

  let body: { studentId?: string; classId?: string; action?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const action = String(body.action ?? "");
  const studentId = String(body.studentId ?? "");
  const classId = String(body.classId ?? "");
  if (!studentId || !classId || !["validate", "no_show"].includes(action)) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const db = supabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "O banco da academia não está ligado." }, { status: 503 });
  }

  await ensureAttendanceSchema().catch(() => undefined);

  const { data: profile } = await db
    .from("profiles")
    .select("id, academy_id, role")
    .eq("id", user.id)
    .maybeSingle();
  const role = String(profile?.role ?? "");
  if (!profile?.academy_id || (role !== "owner" && role !== "instructor")) {
    return NextResponse.json({ error: "Só a recepção altera a chamada." }, { status: 403 });
  }
  const academyId = String(profile.academy_id);

  const { data: classes } = await db
    .from("classes")
    .select("id, weekday, start_time, name, division")
    .eq("academy_id", academyId);
  const classIds = slotIdsFor(classes ?? [], classId);
  const today = isoDate(0);

  const roster = await db
    .from("students")
    .select("id, user_id, email")
    .eq("academy_id", academyId);
  const aliases = new Set<string>([studentId]);
  const seed = (roster.data ?? []).find((row) => String(row.id) === studentId);
  if (seed) {
    for (const row of roster.data ?? []) {
      const sameUser = seed.user_id && row.user_id && String(row.user_id) === String(seed.user_id);
      const sameEmail =
        seed.email &&
        row.email &&
        String(row.email).trim().toLowerCase() === String(seed.email).trim().toLowerCase();
      if (sameUser || sameEmail || String(row.id) === studentId) aliases.add(String(row.id));
    }
  }

  const now = new Date().toISOString();
  const patch =
    action === "validate"
      ? {
          status: "validated",
          validated_at: now,
          validated_by: user.id,
        }
      : {
          status: "no_show",
          validated_at: null,
          validated_by: null,
        };

  const { data: rows, error: readError } = await db
    .from("attendance")
    .select("id")
    .eq("academy_id", academyId)
    .eq("date", today)
    .in("class_id", classIds)
    .in("student_id", [...aliases]);
  if (readError) return NextResponse.json({ error: readError.message }, { status: 400 });
  const ids = (rows ?? []).map((row) => String(row.id));
  if (!ids.length) {
    return NextResponse.json({ ok: true, updated: 0 });
  }

  const { error } = await db.from("attendance").update(patch).in("id", ids);
  if (error && isMissingAttendanceStatusColumn(error.message) && action === "no_show") {
    /* Sem coluna status: some da chamada para não voltar como confirmado. */
    const dropped = await db.from("attendance").delete().in("id", ids);
    if (dropped.error) return NextResponse.json({ error: dropped.error.message }, { status: 400 });
    return NextResponse.json({ ok: true, updated: ids.length, deleted: true });
  }
  if (error && isMissingAttendanceStatusColumn(error.message) && action === "validate") {
    const slim = await db
      .from("attendance")
      .update({ validated_at: now, validated_by: user.id })
      .in("id", ids);
    if (slim.error && isMissingAttendanceStatusColumn(slim.error.message)) {
      return NextResponse.json({ ok: true, updated: 0 });
    }
    if (slim.error) return NextResponse.json({ error: slim.error.message }, { status: 400 });
    return NextResponse.json({ ok: true, updated: ids.length });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, updated: ids.length });
}
