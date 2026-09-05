import { currentMonth, daysSince, isoDate, monthsBetween, parseDate } from "./format";
import { maxDegrees, monthsForNextStep } from "./belts";
import type { AppState, Student } from "./types";

export function lastClassDate(state: AppState, studentId: string) {
  const rows = state.attendance
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => b.date.localeCompare(a.date));
  return rows[0]?.date;
}

export function attendanceInDays(state: AppState, studentId: string, days: number) {
  const from = isoDate(-days);
  return state.attendance.filter((a) => a.studentId === studentId && a.date >= from)
    .length;
}

export function isAtRisk(state: AppState, student: Student) {
  if (student.status !== "active") return false;
  const last = lastClassDate(state, student.id);
  if (!last) return true;
  const days = daysSince(last);
  return days >= 14;
}

export function monthsAtCurrentBelt(state: AppState, student: Student) {
  const gained = [...state.graduations]
    .filter((g) => g.studentId === student.id && g.toBelt === student.belt && g.stripes === 0)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return monthsBetween(gained?.date ?? student.joinDate);
}

export function isPromotionCandidate(state: AppState, student: Student) {
  if (student.status !== "active") return false;
  const att = attendanceInDays(state, student.id, 90);
  const max = maxDegrees(student.belt);
  const nextColor = max === 0 || student.stripes >= max;
  const need = monthsForNextStep(student);

  if (student.division === "kids") {
    return monthsBetween(student.lastPromotionDate) >= need && att >= 12;
  }
  if (student.belt === "black" || student.belt.startsWith("coral") || student.belt === "red") {
    return monthsBetween(student.lastPromotionDate) >= need;
  }
  if (nextColor) {
    return monthsAtCurrentBelt(state, student) >= need && att >= 20;
  }
  return monthsBetween(student.lastPromotionDate) >= need && att >= 12;
}

export function monthRevenue(state: AppState, month: string) {
  return state.payments
    .filter((p) => p.month === month && p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
}

export function monthExpenses(state: AppState, month: string) {
  return state.expenses
    .filter((e) => e.date.startsWith(month))
    .reduce((sum, e) => sum + e.amount, 0);
}

export function overdueTotal(state: AppState) {
  return state.payments
    .filter((p) => p.status === "overdue")
    .reduce((sum, p) => sum + p.amount, 0);
}

export function birthdaysSoon(students: Student[], withinDays = 7) {
  const todayIso = isoDate(0);
  const year = Number(todayIso.slice(0, 4));
  const today = parseDate(todayIso);
  return students.filter((s) => {
    if (!s.birthDate) return false;
    const [, m, d] = s.birthDate.slice(0, 10).split("-").map(Number);
    let next = new Date(Date.UTC(year, (m ?? 1) - 1, d ?? 1, 12));
    if (next < today) next = new Date(Date.UTC(year + 1, (m ?? 1) - 1, d ?? 1, 12));
    const diff = Math.round((next.getTime() - today.getTime()) / 86_400_000);
    return diff >= 0 && diff <= withinDays;
  });
}

export function attendanceThisMonth(state: AppState, studentId: string) {
  const month = currentMonth();
  return state.attendance.filter(
    (a) => a.studentId === studentId && a.date.startsWith(month),
  ).length;
}

export function newStudentsInMonth(state: AppState, month: string) {
  return state.students.filter((s) => s.joinDate.startsWith(month));
}

export function monthChargeStats(state: AppState, month: string) {
  const rows = state.payments.filter(
    (p) => p.month === month && p.status !== "waived",
  );
  const paid = rows.filter((p) => p.status === "paid");
  const open = rows.filter((p) => p.status !== "paid");
  return {
    billed: rows.reduce((sum, p) => sum + p.amount, 0),
    collected: paid.reduce((sum, p) => sum + p.amount, 0),
    open: open.reduce((sum, p) => sum + p.amount, 0),
    paidCount: paid.length,
    totalCount: rows.length,
  };
}

export function monthAttendanceCount(state: AppState, month: string) {
  return state.attendance.filter((a) => a.date.startsWith(month)).length;
}

export function monthStoreSales(state: AppState, month: string) {
  return (state.sales ?? [])
    .filter((s) => s.date.startsWith(month))
    .reduce((sum, s) => sum + s.amount, 0);
}

export function monthDropInRevenue(state: AppState, month: string) {
  return (state.dropIns ?? [])
    .filter((d) => d.date.startsWith(month))
    .reduce((sum, d) => sum + d.amount, 0);
}

export const EVENT_KIND_LABEL: Record<string, string> = {
  seminar: "Seminário",
  championship: "Campeonato",
  openmat: "Open mat",
  extra: "Aula extra",
  graduation: "Graduação",
};
