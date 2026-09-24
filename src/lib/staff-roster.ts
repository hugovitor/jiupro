import type { HouseMembership, Role } from "./types";

export function isStaffRole(role: string | null | undefined): role is "owner" | "instructor" {
  return role === "owner" || role === "instructor";
}

export function dropStaffFromRoster<T extends { userId?: string; email?: string }>(
  students: T[],
  staff: { id?: string; email?: string; role?: string | null }[],
): T[] {
  const ids = new Set<string>();
  const emails = new Set<string>();
  for (const row of staff) {
    if (!isStaffRole(row.role)) continue;
    const id = String(row.id ?? "").trim();
    if (id) ids.add(id);
    const email = String(row.email ?? "").trim().toLowerCase();
    if (email) emails.add(email);
  }
  if (!ids.size && !emails.size) return students;
  return students.filter((student) => {
    const userId = String(student.userId ?? "").trim();
    if (userId && ids.has(userId)) return false;
    const email = String(student.email ?? "").trim().toLowerCase();
    if (email && emails.has(email)) return false;
    return true;
  });
}

export function preferredSessionRole(
  profileRole: string | null | undefined,
  houses: Pick<HouseMembership, "id" | "role">[],
  academyId?: string | null,
): Role {
  const here = academyId ? houses.find((row) => row.id === academyId) : undefined;
  if (here && isStaffRole(here.role)) return here.role;
  const staff = houses.find((row) => isStaffRole(row.role));
  if (staff) return staff.role;
  if (isStaffRole(profileRole) || profileRole === "student") return profileRole;
  return "student";
}
