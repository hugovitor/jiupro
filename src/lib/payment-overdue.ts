import { currentMonth, dayOfMonth } from "./format";
import { normalizeDueDay } from "./billing-status";
import type { Academy, Payment } from "./types";

export function applyOverdueStatus(
  payments: Payment[],
  academy: Pick<Academy, "dueDay">,
  now = new Date(),
): { payments: Payment[]; changed: number } {
  const month = currentMonth();
  const day = dayOfMonth(now);
  const due = normalizeDueDay(academy.dueDay);
  let changed = 0;
  const next = payments.map((payment) => {
    if (payment.status !== "pending") return payment;
    const late = payment.month < month || (payment.month === month && day > due);
    if (!late) return payment;
    changed += 1;
    return { ...payment, status: "overdue" as const };
  });
  return { payments: next, changed };
}
