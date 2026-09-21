import { describe, expect, it } from "vitest";
import { OVERDUE_LOCK_MESSAGE, isOpenChargeLate, studentBlockedByOverdue } from "./overdue-lock";
import type { Payment } from "./types";

function pay(patch: Partial<Payment>): Payment {
  return {
    id: "p1",
    academyId: "a1",
    studentId: "s1",
    month: "2026-09",
    amount: 180,
    status: "pending",
    ...patch,
  };
}

describe("trava por atraso", () => {
  it("trava só quem tem cobrança vencida", () => {
    const now = new Date("2026-09-21T15:00:00.000Z");
    expect(
      studentBlockedByOverdue(
        [pay({ status: "overdue" })],
        "s1",
        { dueDay: 10 },
        now,
      ),
    ).toBe(true);
    expect(
      studentBlockedByOverdue([pay({ status: "paid" })], "s1", { dueDay: 10 }, now),
    ).toBe(false);
    expect(
      studentBlockedByOverdue(
        [pay({ status: "overdue", studentId: "s2" })],
        "s1",
        { dueDay: 10 },
        now,
      ),
    ).toBe(false);
    expect(OVERDUE_LOCK_MESSAGE).toMatch(/Pix da academia/);
  });

  it("pending depois do vencimento também trava, paid e waived não", () => {
    const now = new Date("2026-09-21T15:00:00.000Z");
    expect(isOpenChargeLate(pay({ status: "pending", month: "2026-09" }), 10, now)).toBe(
      true,
    );
    expect(isOpenChargeLate(pay({ status: "pending", month: "2026-09" }), 28, now)).toBe(
      false,
    );
    expect(isOpenChargeLate(pay({ status: "paid" }), 10, now)).toBe(false);
    expect(isOpenChargeLate(pay({ status: "waived" }), 10, now)).toBe(false);
    expect(
      studentBlockedByOverdue(
        [pay({ status: "pending", month: "2026-08" })],
        "s1",
        { dueDay: 28 },
        now,
      ),
    ).toBe(true);
  });
});
