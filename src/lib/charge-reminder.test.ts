import { describe, expect, it } from "vitest";
import { chargeQueueToday, notifiedOnSameDay, shouldNagCharge } from "./charge-reminder";
import { housePixMessage } from "./whatsapp";
import type { Academy, Payment, Student } from "./types";

function pay(patch: Partial<Payment>): Payment {
  return {
    id: "p1",
    academyId: "a1",
    studentId: "s1",
    month: "2026-09",
    amount: 180,
    status: "overdue",
    ...patch,
  };
}

const academy = {
  name: "Casa",
  pixKey: "casa@pix.com",
  pixName: "Casa JJ",
} as Academy;

const student = {
  id: "s1",
  name: "Lucas Ferreira",
  phone: "19988770091",
  status: "active",
} as Student;

describe("cobrança automática no Zap", () => {
  it("não cobra de novo no mesmo dia e prioriza atraso", () => {
    const now = new Date("2026-09-21T18:00:00.000-03:00");
    expect(notifiedOnSameDay(now.toISOString(), now)).toBe(true);
    expect(notifiedOnSameDay("2026-09-20T18:00:00.000-03:00", now)).toBe(false);
    expect(shouldNagCharge(pay({ chargeNotifiedAt: now.toISOString() }), now)).toBe(false);
    expect(shouldNagCharge(pay({ status: "paid" }), now)).toBe(false);

    const queue = chargeQueueToday(
      [
        pay({ id: "late", studentId: "s1", status: "overdue" }),
        pay({
          id: "open",
          studentId: "s2",
          status: "pending",
        }),
        pay({
          id: "done",
          studentId: "s3",
          status: "overdue",
          chargeNotifiedAt: now.toISOString(),
        }),
      ],
      [
        student,
        { ...student, id: "s2", name: "Ana Souza", phone: "19992004411" },
        { ...student, id: "s3", name: "Camila Rocha", phone: "19982221190" },
      ],
      now,
    );
    expect(queue.map((row) => row.paymentId)).toEqual(["late", "open"]);
    expect(queue[0]?.overdue).toBe(true);
  });

  it("mensagem de cobrança usa o Pix da casa, não fatura de gateway", () => {
    const text = housePixMessage(
      academy,
      student,
      pay({ asaasInvoiceUrl: "https://asaas.example/fatura" }),
    );
    expect(text).toContain("casa@pix.com");
    expect(text).not.toContain("asaas.example");
    expect(text).toMatch(/atraso/);
  });
});
