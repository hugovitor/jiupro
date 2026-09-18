import { describe, expect, it } from "vitest";
import { normalizeAcademyHouse } from "./academy-edit";
import { clampPostContent, normalizeStudentPhone } from "./student-live";

describe("módulos · casa, mural, ficha", () => {
  it("grava nome, cidade e meta da academia", () => {
    expect(normalizeAcademyHouse({ name: "  ", city: "Brasília" })).toEqual({
      error: "Informe o nome e a cidade da academia.",
    });
    expect(
      normalizeAcademyHouse({
        name: "Asa Norte",
        city: "Brasília, DF",
        instagram: "@asanortejj",
        monthlyGoal: "12.500,00",
      }),
    ).toMatchObject({
      name: "Asa Norte",
      city: "Brasília",
      state: "DF",
      instagram: "asanortejj",
      monthlyGoal: 12500,
    });
  });

  it("corta recado e limpa WhatsApp do aluno", () => {
    expect(clampPostContent("  oss  ")).toBe("oss");
    expect(clampPostContent("x".repeat(2100)).length).toBe(2000);
    expect(normalizeStudentPhone("  61 98629-8327  ")).toBe("61 98629-8327");
  });
});
