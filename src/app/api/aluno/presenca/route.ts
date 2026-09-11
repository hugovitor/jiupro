import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isoDate, weekdayToday } from "@/lib/format";
import { supabaseAdmin } from "@/lib/operator";
import { classFingerprint } from "@/lib/roster-identity";
import { ensureStudentRosterRow } from "@/lib/student-enroll";
import {
  attendanceStatusKnown,
  ensureAttendanceSchema,
  isMissingAttendanceStatusColumn,
  rememberAttendanceStatusColumn,
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

type AttendanceClient = NonNullable<ReturnType<typeof supabaseAdmin>>;

function withoutStatus(row: Record<string, unknown>) {
  const next = { ...row };
  delete next.status;
  delete next.validated_at;
  delete next.validated_by;
  return next;
}

function resolveClassId(
  classes: { id: unknown; weekday?: unknown; start_time?: unknown; name?: unknown; division?: unknown }[],
  body: {
    classId?: string;
    weekday?: number;
    startTime?: string;
    name?: string;
    division?: string;
  },
) {
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
  let classId =
    classes.find((row) => String(row.id) === wantedId)?.id ??
    classes.find((row) => {
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
  classId = classId ? String(classId) : "";
  if (!classId && body.startTime) {
    const time = timeValue(String(body.startTime));
    const weekday = body.weekday != null ? Number(body.weekday) : weekdayToday();
    classId =
      classes.find(
        (row) => Number(row.weekday) === weekday && timeValue(String(row.start_time ?? "")) === time,
      )?.id
        ? String(
            classes.find(
              (row) =>
                Number(row.weekday) === weekday && timeValue(String(row.start_time ?? "")) === time,
            )?.id,
          )
        : "";
  }
  const slotIds = classes
    .filter((row) => {
      const hit = classes.find((item) => String(item.id) === classId);
      if (!hit) return String(row.id) === classId;
      return (
        Number(row.weekday) === Number(hit.weekday) &&
        timeValue(String(row.start_time ?? "")) === timeValue(String(hit.start_time ?? "")) &&
        String(row.division ?? "adult") === String(hit.division ?? "adult")
      );
    })
    .map((row) => String(row.id));
  return { classId, slotIds };
}

async function studentAndClasses(db: AttendanceClient, user: { id: string; email?: string | null }) {
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("id, academy_id, email, name, phone")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile?.academy_id) {
    return { error: "Não achamos sua academia." };
  }
  const academyId = String(profile.academy_id);
  const admin = supabaseAdmin();
  let studentId = "";
  if (admin) {
    const roster = await ensureStudentRosterRow(admin, {
      academyId,
      userId: user.id,
      email: user.email ?? String(profile.email ?? ""),
      name: String(profile.name ?? user.email ?? "Aluno"),
      phone: String(profile.phone ?? ""),
    });
    if ("error" in roster) return { error: roster.error };
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
  if (!studentId) return { error: "Sua ficha ainda não está na academia." };
  const { data: classes, error: classError } = await db
    .from("classes")
    .select("id, weekday, start_time, name, division")
    .eq("academy_id", academyId);
  if (classError) return { error: classError.message };
  return { academyId, studentId, classes: classes ?? [] };
}

async function loadExistingAttendance(
  db: AttendanceClient,
  academyId: string,
  studentId: string,
  today: string,
  classIds: string[],
) {
  const ids = classIds.length ? classIds : [];
  if (!ids.length) return [];
  const query = () =>
    db
      .from("attendance")
      .select("id, class_id, method")
      .eq("academy_id", academyId)
      .eq("student_id", studentId)
      .eq("date", today)
      .in("class_id", ids)
      .limit(8);
  const result = await query();
  if (result.error) throw new Error(result.error.message);
  return (result.data ?? []).map((row) => ({
    id: String(row.id),
    class_id: String(row.class_id ?? ""),
    status: String(row.method ?? "app") === "app" ? "pending" : "validated",
  }));
}

async function writeAttendance(
  db: AttendanceClient,
  row: Record<string, unknown>,
  existingId?: string,
) {
  const run = async (payload: Record<string, unknown>) =>
    existingId
      ? db.from("attendance").update(payload).eq("id", existingId)
      : db.from("attendance").insert(payload);

  const slim = withoutStatus(row);
  const useStatus = attendanceStatusKnown() !== false;
  let { error } = await run(useStatus ? row : slim);
  if (error && isMissingAttendanceStatusColumn(error.message)) {
    rememberAttendanceStatusColumn(false);
    ({ error } = await run(slim));
  } else if (!error && useStatus) {
    rememberAttendanceStatusColumn(true);
  }
  return error;
}

function dbForToken(token: string) {
  const admin = supabaseAdmin();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return (
    admin ??
    (url && anon
      ? createClient(url, anon, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        })
      : null)
  );
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

  const db = dbForToken(token);
  if (!db) {
    return NextResponse.json({ error: "O banco da academia não está ligado." }, { status: 503 });
  }

  await ensureAttendanceSchema().catch(() => undefined);

  const ctx = await studentAndClasses(db, user);
  if ("error" in ctx && ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: 400 });
  }
  const { academyId, studentId, classes } = ctx as {
    academyId: string;
    studentId: string;
    classes: { id: unknown; weekday?: unknown; start_time?: unknown; name?: unknown; division?: unknown }[];
  };

  const { classId, slotIds } = resolveClassId(classes, body);
  const today = isoDate(0);
  if (!classId) {
    return NextResponse.json({ error: "Não achamos essa turma na academia." }, { status: 400 });
  }
  let existingRows: { id: string; class_id: string; status: string }[] = [];
  try {
    existingRows = await loadExistingAttendance(
      db,
      academyId,
      studentId,
      today,
      slotIds.length ? slotIds : [String(classId)],
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Não deu para ler a chamada.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const existing =
    existingRows.find((row) => row.status !== "no_show") ?? existingRows[0];
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
    const error = await writeAttendance(
      db,
      {
        status: "pending",
        method: "app",
        checked_in_at: now,
        validated_at: null,
        validated_by: null,
      },
      existing.id,
    );
    if (error) {
      const duplicate = /duplicate|unique|23505/i.test(error.message);
      return NextResponse.json(
        {
          error: duplicate
            ? "Você já confirmou esta aula."
            : isMissingAttendanceStatusColumn(error.message)
              ? "Não deu para gravar a presença. Confirme de novo."
              : error.message,
        },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true, attendanceId: existing.id, studentId, classId });
  }

  const id = crypto.randomUUID();
  const error = await writeAttendance(db, {
    id,
    academy_id: academyId,
    student_id: studentId,
    class_id: classId,
    date: today,
    checked_in_at: now,
    method: "app",
    status: "pending",
  });
  if (error) {
    const duplicate = /duplicate|unique|23505/i.test(error.message);
    return NextResponse.json(
      {
        error: duplicate
          ? "Você já confirmou esta aula."
          : isMissingAttendanceStatusColumn(error.message)
            ? "Não deu para gravar a presença. Confirme de novo."
            : error.message,
      },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, attendanceId: id, studentId, classId });
}

export async function DELETE(request: Request) {
  const token = bearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Entre de novo para sair da lista." }, { status: 401 });
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

  const db = dbForToken(token);
  if (!db) {
    return NextResponse.json({ error: "O banco da academia não está ligado." }, { status: 503 });
  }

  const ctx = await studentAndClasses(db, user);
  if ("error" in ctx && ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: 400 });
  }
  const { academyId, studentId, classes } = ctx as {
    academyId: string;
    studentId: string;
    classes: { id: unknown; weekday?: unknown; start_time?: unknown; name?: unknown; division?: unknown }[];
  };
  const { classId, slotIds } = resolveClassId(classes, body);
  if (!classId) {
    return NextResponse.json({ error: "Não achamos essa turma na academia." }, { status: 400 });
  }
  const ids = slotIds.length ? slotIds : [classId];
  const today = isoDate(0);

  const full = await db
    .from("attendance")
    .select("id, method, status, validated_at")
    .eq("academy_id", academyId)
    .eq("student_id", studentId)
    .eq("date", today)
    .in("class_id", ids);
  let rows = full.data ?? [];
  if (full.error && isMissingAttendanceStatusColumn(full.error.message)) {
    const slim = await db
      .from("attendance")
      .select("id, method")
      .eq("academy_id", academyId)
      .eq("student_id", studentId)
      .eq("date", today)
      .in("class_id", ids);
    if (slim.error) return NextResponse.json({ error: slim.error.message }, { status: 400 });
    rows = (slim.data ?? []).map((row) => ({
      ...row,
      status: "pending",
      validated_at: null,
    }));
  } else if (full.error) {
    return NextResponse.json({ error: full.error.message }, { status: 400 });
  }

  const drop = rows
    .filter((row) => {
      if (String(row.method ?? "app") !== "app") return false;
      if (row.validated_at) return false;
      return String(row.status ?? "pending") !== "validated" || !row.validated_at;
    })
    .map((row) => String(row.id));

  if (drop.length) {
    const { error } = await db.from("attendance").delete().in("id", drop);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, removed: drop.length });
}
