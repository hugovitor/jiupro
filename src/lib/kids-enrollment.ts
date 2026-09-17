const KIDS_MAX_AGE = 15;

export function yearsFromBirthDate(birthDate?: string | null) {
  const raw = (birthDate ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const birth = new Date(`${raw}T12:00:00-03:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

export function enrollmentIsKids(input: { division?: string | null; birthDate?: string | null }) {
  if (input.division === "kids") return true;
  const age = yearsFromBirthDate(input.birthDate);
  return age != null && age <= KIDS_MAX_AGE;
}

export function kidsGuardianRequiredError(input: {
  division?: string | null;
  birthDate?: string | null;
  guardianName?: string | null;
}) {
  if (!enrollmentIsKids(input)) return null;
  if (!input.guardianName?.trim()) {
    return "No kids, informe o nome do responsável (LGPD, art. 14).";
  }
  return null;
}

export function resolvedEnrollmentDivision(input: {
  division?: string | null;
  birthDate?: string | null;
}): "adult" | "kids" {
  return enrollmentIsKids(input) ? "kids" : "adult";
}
