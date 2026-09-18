import { beltsForDivision } from "./belts";
import { kidsGuardianRequiredError } from "./kids-enrollment";
import { clampPersonName, normalizeStudentPhone } from "./student-live";
import type { BeltId, Student } from "./types";

function parseFee(raw: string | number | undefined) {
  if (typeof raw === "number") return Number.isFinite(raw) ? Math.max(0, raw) : 0;
  const text = String(raw ?? "").trim();
  if (!text) return 0;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export type StudentFichaInput = {
  name: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  guardianName?: string;
  division: "adult" | "kids";
  belt: string;
  monthlyFee?: string | number;
  notes?: string;
  cpf?: string;
};

export type StudentFichaPatch = Pick<
  Student,
  | "name"
  | "phone"
  | "email"
  | "birthDate"
  | "guardianName"
  | "division"
  | "belt"
  | "monthlyFee"
  | "notes"
  | "cpf"
>;

export function normalizeStudentFicha(
  input: StudentFichaInput,
): StudentFichaPatch | { error: string } {
  const name = clampPersonName(input.name);
  if (name.length < 2) return { error: "Informe o nome do aluno." };
  const division = input.division === "kids" ? "kids" : "adult";
  const guardianError = kidsGuardianRequiredError({
    division,
    birthDate: input.birthDate,
    guardianName: input.guardianName,
  });
  if (guardianError) return { error: guardianError };
  const belts = beltsForDivision(division);
  const belt = (belts.some((item) => item.id === input.belt) ? input.belt : "white") as BeltId;
  const birthDate = (input.birthDate ?? "").slice(0, 10);
  const email = (input.email ?? "").trim().toLowerCase();
  const cpf = (input.cpf ?? "").replace(/\D/g, "").slice(0, 11);
  return {
    name,
    phone: normalizeStudentPhone(input.phone ?? ""),
    email,
    birthDate: /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? birthDate : "",
    guardianName: division === "kids" ? (input.guardianName ?? "").trim() : undefined,
    division,
    belt,
    monthlyFee: parseFee(input.monthlyFee),
    notes: (input.notes ?? "").trim().slice(0, 500),
    cpf: cpf || undefined,
  };
}
