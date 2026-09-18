import { describe, expect, it } from "vitest";
import {
  academyPlanMeta,
  healthGaps,
  isFollowUpDue,
  isPlanId,
  summarizeOperatorAcademies,
} from "./operator-hq";

describe("central do dono", () => {
  it("soma academias, alunos e recorrência só das ativas", () => {
    const stats = summarizeOperatorAcademies([
      { plan: "essencial", planPrice: 97, billingStatus: "active", subscribed: true, students: 12 },
      { plan: "academia", planPrice: 197, billingStatus: "active", subscribed: false, students: 40 },
      { plan: "equipe", planPrice: 347, billingStatus: "trialing", subscribed: true, students: 80 },
      { plan: "essencial", planPrice: 97, billingStatus: "canceled", subscribed: false, students: 3 },
      { plan: "academia", planPrice: 197, billingStatus: "past_due", subscribed: true, students: 9 },
    ]);
    expect(stats.academies).toBe(5);
    expect(stats.students).toBe(144);
    expect(stats.mrr).toBe(294);
    expect(stats.granted).toBe(1);
    expect(stats.trialing).toBe(1);
    expect(stats.pastDue).toBe(1);
    expect(stats.byPlan).toEqual({ essencial: 2, academia: 2, equipe: 1 });
  });

  it("marca retorno vencido inclusive no dia", () => {
    expect(isFollowUpDue("2026-09-18", "2026-09-18")).toBe(true);
    expect(isFollowUpDue("2026-09-17", "2026-09-18")).toBe(true);
    expect(isFollowUpDue("2026-09-19", "2026-09-18")).toBe(false);
    expect(isFollowUpDue("", "2026-09-18")).toBe(false);
  });

  it("reconhece plano e lista o que falta no deploy", () => {
    expect(isPlanId("equipe")).toBe(true);
    expect(isPlanId("premium")).toBe(false);
    expect(academyPlanMeta("equipe")).toEqual({
      id: "equipe",
      planLabel: "Equipe",
      planPrice: 347,
    });
    expect(
      healthGaps({
        supabase: true,
        serviceRole: false,
        stripe: false,
        redis: true,
        env: "production",
      }),
    ).toEqual(["service role para ver academias", "Stripe para cobrança do plano"]);
  });
});
