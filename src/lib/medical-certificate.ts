import { isoDate } from "./format";

export type MedicalStatus = "ok" | "expiring" | "expired" | "missing";

function calendarDay(iso?: string) {
  const raw = String(iso ?? "").trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

export function addCalendarDays(iso: string, days: number) {
  const day = calendarDay(iso);
  if (!day) return "";
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, (date ?? 1) + days))
    .toISOString()
    .slice(0, 10);
}

export function medicalStatus(until?: string, today = isoDate(0)): MedicalStatus {
  const day = calendarDay(until);
  if (!day) return "missing";
  if (day < today) return "expired";
  if (day <= addCalendarDays(today, 30)) return "expiring";
  return "ok";
}

export function medicalNeedsAttention(until?: string, today = isoDate(0)) {
  const status = medicalStatus(until, today);
  return status === "missing" || status === "expired";
}

export function medicalLabel(until?: string, today = isoDate(0)) {
  const status = medicalStatus(until, today);
  if (status === "missing") return "Sem atestado";
  if (status === "expired") return "Atestado vencido";
  if (status === "expiring") return "Atestado vencendo";
  return "Atestado em dia";
}

export function medicalSortRank(until?: string, today = isoDate(0)) {
  const status = medicalStatus(until, today);
  if (status === "expired") return 0;
  if (status === "missing") return 1;
  if (status === "expiring") return 2;
  return 3;
}
