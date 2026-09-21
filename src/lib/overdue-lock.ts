import { currentMonth, dayOfMonth } from "./format";
import { normalizeDueDay } from "./billing-status";
import type { Academy, Payment } from "./types";

export const OVERDUE_LOCK_MESSAGE =
  "Sua mensalidade está em atraso. Pague no Pix da academia e avise a secretaria. O professor ainda pode te colocar na lista no tatame.";

type ChargeRow = Pick<Payment, "studentId" | "status" | "month">;

export function isOpenChargeLate(
  payment: Pick<Payment, "status" | "month">,
  dueDay: number,
  now = new Date(),
): boolean {
  if (payment.status === "overdue") return true;
  if (payment.status !== "pending") return false;
  const month = currentMonth(now);
  const day = dayOfMonth(now);
  const due = normalizeDueDay(dueDay);
  return payment.month < month || (payment.month === month && day > due);
}

export function studentBlockedByOverdue(
  payments: ChargeRow[],
  studentId: string,
  academy: Pick<Academy, "dueDay">,
  now = new Date(),
): boolean {
  if (!studentId) return false;
  return payments.some(
    (payment) =>
      payment.studentId === studentId && isOpenChargeLate(payment, academy.dueDay, now),
  );
}
