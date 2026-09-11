import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isoDate, weekdayToday } from "@/lib/format";
import { supabaseAdmin } from "@/lib/operator";
import { classFingerprint } from "@/lib/roster-identity";
import { ensureStudentRosterRow } from "@/lib/student-enroll";

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

export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Entre de novo para confirmar a aula." }, { status: 401 });
  }
  const user = await userFromToken(token);
  if (!user) {
    return NextResponse.json({ error: "Sessão expirada. Entre de novo." }, { status: 401 });
  }

  let body: {
    classId?: string;
    weekday?: number;
    startTime?: string;
    name?: string;
    division?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const admin = supabaseAdmin();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const db =
    admin ??
    (url && anon
      ? createClient(url, anon, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        })
      : null);
  if (!db) {
    return NextResponse.json({ error: "O banco da academia não está ligado." }, { status: 503 });
  }

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("id, academy_id, email, name, phone")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile?.academy_id) {
    return NextResponse.json({ error: "Não achamos sua academia." }, { status: 400 });
  }
  const academyId = String(profile.academy_id);

  let studentId = "";
  if (admin) {
    const roster = await ensureStudentRosterRow(admin, {
      academyId,
      userId: user.id,
      email: user.email ?? String(profile.email ?? ""),
      name: String(profile.name ?? user.email ?? "Aluno"),
      phone: String(profile.phone ?? ""),
    });
    if ("error" in roster) {
      return NextResponse.json({ error: roster.error }, { status: 400 });
    }
    studentId = roster.studentId;
  } else {
    const { data: mine } = await db
      .from("students")
      .select("id")
      .eq("academy_id", academyId)
      .eq("user_id", user.id)
      .maybeSingle();
    studentId = mine?.id ? String(mine.id) : "";
  }
  if (!studentId) {
    return NextResponse.json({ error: "Sua ficha ainda não está na academia." }, { status: 400 });
  }

  const { data: classes, error: classError } = await db
    .from("classes")
    .select("id, weekday, start_time, name, division")
    .eq("academy_id", academyId);
  if (classError) {
    return NextResponse.json({ error: classError.message }, { status: 400 });
  }

  const wantedId = String(body.classId ?? "");
  const wantedPrint =
    body.weekday != null && body.startTime
      ? classFingerprint({
          weekday: Number(body.weekday),
          startTime: String(body.startTime),
          name: String(body.name ?? ""),
          division: (body.division as "adult" | "kids" | "mixed") || "adult",
        })
      : "";
  const today = isoDate(0);
  let classId =
    (classes ?? []).find((row) => String(row.id) === wantedId)?.id ??
    (classes ?? []).find((row) => {
      if (!wantedPrint) return false;
      return (
        classFingerprint({
          weekday: Number(row.weekday),
          startTime: String(row.start_time ?? ""),
          name: String(row.name ?? ""),
          division: (String(row.division ?? "adult") as "adult" | "kids" | "mixed") || "adult",
        }) === wantedPrint
      );
    })?.id ??
    "";
  if (!classId && body.startTime) {
    const time = timeValue(String(body.startTime));
    const weekday = body.weekday != null ? Number(body.weekday) : weekdayToday();
    classId =
      (classes ?? []).find(
        (row) => Number(row.weekday) === weekday && timeValue(String(row.start_time ?? "")) === time,
      )?.id ?? "";
  }
  if (!classId) {
    return NextResponse.json({ error: "Não achamos essa turma na academia." }, { status: 400 });
  }

  const slotIds = (classes ?? [])
    .filter((row) => {
      const hit = (classes ?? []).find((item) => String(item.id) === String(classId));
      if (!hit) return String(row.id) === String(classId);
      return (
        Number(row.weekday) === Number(hit.weekday) &&
        timeValue(String(row.start_time ?? "")) === timeValue(String(hit.start_time ?? "")) &&
        String(row.division ?? "adult") === String(hit.division ?? "adult")
      );
    })
    .map((row) => String(row.id));
  const { data: existingRows } = await db
    .from("attendance")
    .select("id, status, class_id")
    .eq("academy_id", academyId)
    .eq("student_id", studentId)
    .eq("date", today)
    .in("class_id", slotIds.length ? slotIds : [classId])
    .limit(8);
  const existing =
    existingRows?.find((row) => row.status !== "no_show") ?? existingRows?.[0];
  if (existing?.id && existing.status !== "no_show") {
    return NextResponse.json({
      ok: true,
      attendanceId: existing.id,
      studentId,
      classId: String(existing.class_id ?? classId),
    });
  }

  const now = new Date().toISOString();
  if (existing?.id) {
    const { error } = await db
      .from("attendance")
      .update({
        status: "pending",
        method: "app",
        checked_in_at: now,
        validated_at: null,
        validated_by: null,
      })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, attendanceId: existing.id, studentId, classId });
  }

  const id = crypto.randomUUID();
  const { error } = await db.from("attendance").insert({
    id,
    academy_id: academyId,
    student_id: studentId,
    class_id: classId,
    date: today,
    checked_in_at: now,
    method: "app",
    status: "pending",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, attendanceId: id, studentId, classId });
}
