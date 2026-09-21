import { canWhatsApp } from "./whatsapp";
import type { Payment, Student } from "./types";

export type ChargeQueueItem = {
  paymentId: string;
  studentId: string;
  name: string;
  phone: string;
  overdue: boolean;
};

function civilDay(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    const raw = String(value ?? "").trim();
    return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : "";
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const n = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${n("year")}-${n("month")}-${n("day")}`;
}

export function notifiedOnSameDay(notifiedAt?: string, now = new Date()) {
  if (!notifiedAt) return false;
  const day = civilDay(notifiedAt);
  return Boolean(day) && day === civilDay(now);
}

export function isOpenCharge(payment: Pick<Payment, "status">) {
  return payment.status === "overdue" || payment.status === "pending";
}

export function shouldNagCharge(
  payment: Pick<Payment, "status" | "chargeNotifiedAt">,
  now = new Date(),
) {
  return isOpenCharge(payment) && !notifiedOnSameDay(payment.chargeNotifiedAt, now);
}

export function chargeQueueToday(
  payments: Payment[],
  students: Student[],
  now = new Date(),
): ChargeQueueItem[] {
  const rows: ChargeQueueItem[] = [];
  for (const payment of payments) {
    if (!shouldNagCharge(payment, now)) continue;
    const student = students.find((item) => item.id === payment.studentId);
    if (!student || student.status === "inactive") continue;
    if (!canWhatsApp(student.phone)) continue;
    rows.push({
      paymentId: payment.id,
      studentId: student.id,
      name: student.name,
      phone: student.phone,
      overdue: payment.status === "overdue",
    });
  }
  return rows.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}
