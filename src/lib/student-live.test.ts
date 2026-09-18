import { describe, expect, it } from "vitest";
import {
  normalizeAcademyEvent,
  normalizeAcademyHouse,
  normalizeInventoryItem,
} from "./academy-edit";
import { normalizeStudentFicha } from "./student-ficha";
import { clampPersonName, clampPostContent, normalizeStudentPhone } from "./student-live";

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
    expect(clampPersonName("  João   Pedro  ")).toBe("João Pedro");
  });

  it("edita ficha com kids, faixa e mensalidade", () => {
    expect(normalizeStudentFicha({ name: "A", division: "adult", belt: "blue" })).toEqual({
      error: "Informe o nome do aluno.",
    });
    expect(
      normalizeStudentFicha({
        name: "Luna",
        division: "kids",
        belt: "blue",
        guardianName: "",
      }),
    ).toEqual({ error: "No kids, informe o nome do responsável (LGPD, art. 14)." });
    expect(
      normalizeStudentFicha({
        name: "  João Pedro  ",
        phone: "61 99999-0000",
        email: "Joao@Casa.JJ",
        division: "adult",
        belt: "blue",
        monthlyFee: "180,50",
        cpf: "123.456.789-09",
      }),
    ).toMatchObject({
      name: "João Pedro",
      email: "joao@casa.jj",
      belt: "blue",
      monthlyFee: 180.5,
      cpf: "12345678909",
    });
  });

  it("grava evento e item da prateleira", () => {
    expect(
      normalizeAcademyEvent({
        title: " ",
        kind: "seminar",
        date: "2026-10-01",
        time: "10:00",
        place: "Tatame",
      }),
    ).toEqual({
      error: "Informe o título do evento.",
    });
    expect(
      normalizeAcademyEvent({
        title: " Open mat ",
        kind: "openmat",
        date: "2026-10-04",
        time: "09:00",
        place: "Tatame",
        fee: "40,00",
      }),
    ).toMatchObject({
      title: "Open mat",
      kind: "openmat",
      fee: 40,
    });
    expect(normalizeInventoryItem({ name: " " })).toEqual({ error: "Informe o nome do item." });
    expect(
      normalizeInventoryItem({
        name: "Kimono A2",
        category: "kimono",
        size: "A2",
        quantity: "8",
        price: "350,00",
        cost: "180",
      }),
    ).toMatchObject({
      name: "Kimono A2",
      category: "kimono",
      size: "A2",
      quantity: 8,
      price: 350,
      cost: 180,
    });
  });
});
