import type { Attendance, ClassSession, Student } from "@/lib/types";
import { isoDate, minutes } from "@/lib/format";
import { dayCode } from "@/lib/whatsapp";

/** Código de 4 dígitos desta aula neste dia — não vale para outra turma. */
export function classCode(date: string, academySlug: string, classId: string) {
  return dayCode(date, `${academySlug}|${classId}`);
}

export type ClassPhase = "upcoming" | "open" | "live" | "grace" | "closed";

const OPEN_BEFORE_MIN = 20;
const GRACE_AFTER_MIN = 15;
const LATE_AFTER_MIN = 10;
const HABITUAL_WINDOW_DAYS = 56;
const HABITUAL_MIN = 3;

export function classEndMin(session: ClassSession) {
  return minutes(session.startTime) + session.durationMin;
}

export function classPhase(session: ClassSession, now = new Date()): ClassPhase {
  const t = minutes(now);
  const start = minutes(session.startTime);
  const end = classEndMin(session);
  if (t < start - OPEN_BEFORE_MIN) return "upcoming";
  if (t < start) return "open";
  if (t < end) return "live";
  if (t < end + GRACE_AFTER_MIN) return "grace";
  return "closed";
}

export function studentCanSelfCheckIn(session: ClassSession, now = new Date()) {
  const phase = classPhase(session, now);
  return phase === "open" || phase === "live" || phase === "grace";
}

export function isLateCheckIn(session: ClassSession, checkedInAt: string) {
  return minutes(new Date(checkedInAt)) > minutes(session.startTime) + LATE_AFTER_MIN;
}

export function phaseLabel(phase: ClassPhase) {
  switch (phase) {
    case "upcoming":
      return "Ainda não abriu";
    case "open":
      return "Chamada aberta";
    case "live":
      return "Aula ao vivo";
    case "grace":
      return "Tolerância";
    case "closed":
      return "Encerrada";
  }
}

export function phaseHint(session: ClassSession, now = new Date()) {
  const phase = classPhase(session, now);
  const start = minutes(session.startTime);
  const end = classEndMin(session);
  const t = minutes(now);
  if (phase === "upcoming") {
    const wait = start - OPEN_BEFORE_MIN - t;
    return wait > 0 ? `Chamada abre em ${wait} min` : "Chamada abrindo";
  }
  if (phase === "open") return `Começa em ${Math.max(0, start - t)} min`;
  if (phase === "live") return `Termina em ${Math.max(0, end - t)} min`;
  if (phase === "grace") {
    return `PWA fecha em ${Math.max(0, end + GRACE_AFTER_MIN - t)} min`;
  }
  return "Aula encerrada — a recepção ainda ajusta a lista";
}

export function selfCheckInHint(session: ClassSession, now = new Date()) {
  const phase = classPhase(session, now);
  if (phase === "upcoming") {
    const openAt = minutes(session.startTime) - OPEN_BEFORE_MIN;
    const h = Math.floor(openAt / 60);
    const m = openAt % 60;
    return `A chamada abre às ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}. Peça ao professor se já estiver no tatame.`;
  }
  if (phase === "closed") {
    return "A chamada desta aula já fechou. Peça ao professor na recepção.";
  }
  return "Digite o código de 4 dígitos desta turma, no quadro da recepção.";
}

/** Aula ao vivo → janela aberta → próxima hoje → última de hoje. */
export function recommendClass(today: ClassSession[], now = new Date()) {
  if (today.length === 0) return null;
  const ranked = [...today].sort(
    (a, b) => minutes(a.startTime) - minutes(b.startTime),
  );
  const live = ranked.find((c) => classPhase(c, now) === "live");
  if (live) return live;
  const windowed = ranked.find((c) => {
    const p = classPhase(c, now);
    return p === "open" || p === "grace";
  });
  if (windowed) return windowed;
  const upcoming = ranked.find((c) => classPhase(c, now) === "upcoming");
  if (upcoming) return upcoming;
  return ranked[ranked.length - 1] ?? null;
}

function daysAgoIso(n: number) {
  return isoDate(-n);
}

/** Aluno com ≥3 presenças nesta turma nas últimas 8 semanas. */
export function habitualStudentIds(classId: string, attendance: Attendance[]) {
  const from = daysAgoIso(HABITUAL_WINDOW_DAYS);
  const counts = new Map<string, number>();
  for (const a of attendance) {
    if (a.classId !== classId || a.date < from) continue;
    counts.set(a.studentId, (counts.get(a.studentId) ?? 0) + 1);
  }
  const ids = new Set<string>();
  for (const [id, n] of counts) {
    if (n >= HABITUAL_MIN) ids.add(id);
  }
  return ids;
}

export function lastVisitIso(studentId: string, attendance: Attendance[]) {
  const dates = attendance.filter((a) => a.studentId === studentId).map((a) => a.date);
  if (dates.length === 0) return null;
  return dates.sort().at(-1) ?? null;
}

export function isOverdue(student: Student, attendance: Attendance[], days = 14) {
  if (student.status !== "active") return false;
  const last = lastVisitIso(student.id, attendance);
  if (!last) return true;
  return last < daysAgoIso(days);
}

export function sortByName(a: Student, b: Student) {
  return a.name.localeCompare(b.name, "pt-BR");
}

export function methodLabel(method: Attendance["method"]) {
  switch (method) {
    case "manual":
      return "Recepção";
    case "code":
      return "Código";
    case "app":
      return "App";
  }
}
