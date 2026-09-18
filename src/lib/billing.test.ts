import { describe, expect, it } from "vitest";
import { academyNeedsPayment, billingFromStripe, normalizeDueDay } from "./billing-status";
import { applyOverdueStatus } from "./payment-overdue";
import type { Payment } from "./types";

function pay(patch: Partial<Payment>): Payment {
  return {
    id: "p1",
    academyId: "a1",
    studentId: "s1",
    month: "2020-01",
    amount: 180,
    status: "pending",
    ...patch,
  };
}

describe("cobrança", () => {
  it("vira atraso no vencimento, não no mês seguinte", () => {
    const due = applyOverdueStatus([pay({ month: "2020-01", status: "pending" })], { dueDay: 10 });
    expect(due.changed).toBe(1);
    expect(due.payments[0]?.status).toBe("overdue");

    const kept = applyOverdueStatus([pay({ status: "paid" })], { dueDay: 10 });
    expect(kept.changed).toBe(0);
    expect(kept.payments[0]?.status).toBe("paid");
  });

  it("trava academia real sem pagamento quando o Stripe está ligado", () => {
    expect(
      academyNeedsPayment(
        { id: "ac-real", billingStatus: "none", stripeSubscriptionId: "" },
        true,
      ),
    ).toBe(true);
    expect(
      academyNeedsPayment(
        { id: "ac-real", billingStatus: "active", stripeSubscriptionId: "sub_1" },
        true,
      ),
    ).toBe(false);
    expect(
      academyNeedsPayment(
        { id: "ac_origem", billingStatus: "none", stripeSubscriptionId: "" },
        true,
      ),
    ).toBe(false);
    expect(billingFromStripe("past_due")).toBe("past_due");
    expect(normalizeDueDay(40)).toBe(28);
    expect(normalizeDueDay("8")).toBe(8);
  });
});
