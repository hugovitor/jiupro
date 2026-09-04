import { monthsBetween } from "./format";
import type { AppState, Student } from "./types";

export function lastClassDate(state: AppState, studentId: string) {
  const rows = state.attendance
    .filter((a) => a.studentId === studentId)
    .sort((a, b) => b.date.localeCompare(a.date));
  return rows[0]?.date;
}

export function attendanceInDays(state: AppState, studentId: string, days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const from = cutoff.toISOString().slice(0, 10);
  return state.attendance.filter((a) => a.studentId === studentId && a.date >= from)
    .length;
}

export function isAtRisk(state: AppState, student: Student) {
  if (student.status !== "active") return false;
  const last = lastClassDate(state, student.id);
  if (!last) return true;
  const days = Math.floor(
    (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24),
  );
  return days >= 14;
}

export function isPromotionCandidate(state: AppState, student: Student) {
  if (student.status !== "active") return false;
  const months = monthsBetween(student.lastPromotionDate);
  const att = attendanceInDays(state, student.id, 90);
  if (student.division === "kids") {
    return months >= 4 && att >= 12;
  }
  if (student.stripes >= 4) {
    return months >= 8 && att >= 20;
  }
  return months >= 3 && att >= 12;
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
