import { describe, expect, it } from "vitest";
import {
  applyContractSignature,
  contractSignerError,
  contractStatus,
  defaultEnrollmentContract,
  hasPublishedContract,
  nextContractVersion,
  normalizeEnrollmentContract,
  studentBlockedByContract,
  studentNeedsContractSignature,
} from "./enrollment-contract";

const academy = {
  contractBody: defaultEnrollmentContract("Casa"),
  contractVersion: 1,
};

describe("contrato da academia", () => {
  it("publica texto e detecta quem falta assinar", () => {
    expect(hasPublishedContract({ contractBody: "", contractVersion: 1 })).toBe(false);
    expect(hasPublishedContract(academy)).toBe(true);
    expect(contractStatus({ contractSignedVersion: undefined }, academy)).toBe("pending");
    expect(contractStatus({ contractSignedVersion: 1 }, academy)).toBe("signed");
    expect(
      contractStatus({ contractSignedVersion: 1 }, { ...academy, contractVersion: 2 }),
    ).toBe("stale");
    expect(normalizeEnrollmentContract("curto")).toEqual({
      error: "O contrato está curto demais. Escreva as regras da casa.",
    });
    expect(typeof normalizeEnrollmentContract(academy.contractBody)).toBe("string");
    expect(academy.contractBody).toMatch(/Pix da academia/);
    expect(academy.contractBody).toMatch(/TatameX/);
  });

  it("trava mensalista sem aceite e deixa experimental treinar uma vez", () => {
    const unsigned = { id: "s1", status: "active" as const, contractSignedVersion: undefined };
    expect(studentNeedsContractSignature(unsigned, academy)).toBe(true);
    expect(studentBlockedByContract(unsigned, academy, 0)).toBe(true);
    expect(
      studentBlockedByContract(
        { id: "s2", status: "trial", contractSignedVersion: undefined },
        academy,
        0,
      ),
    ).toBe(false);
    expect(
      studentBlockedByContract(
        { id: "s2", status: "trial", contractSignedVersion: undefined },
        academy,
        1,
      ),
    ).toBe(true);
    expect(
      studentBlockedByContract(
        { id: "s3", status: "active", contractSignedVersion: 1 },
        academy,
        0,
      ),
    ).toBe(false);
  });

  it("no kids exige responsável e sobe versão só se o texto mudou", () => {
    expect(
      contractSignerError({ division: "kids", guardianName: "" }),
    ).toMatch(/responsável/);
    expect(
      contractSignerError({
        division: "kids",
        guardianName: "Eduardo Martins",
      }),
    ).toBeNull();
    expect(nextContractVersion(academy, academy.contractBody)).toBe(1);
    expect(nextContractVersion(academy, `${academy.contractBody}\n\n8. Extra.`)).toBe(2);
    expect(nextContractVersion({ contractBody: "", contractVersion: 0 }, academy.contractBody)).toBe(
      1,
    );
    expect(
      applyContractSignature(
        { name: "João", division: "adult" },
        academy,
        "2026-09-02T10:00:00.000Z",
      ),
    ).toMatchObject({
      contractSignedVersion: 1,
      contractSignedBy: "João",
      contractSignedAs: "student",
    });
  });
});
