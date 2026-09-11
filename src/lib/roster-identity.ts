import type { AppState, Attendance, ClassSession, Student } from "./types";
import { attendanceStatus } from "./attendance";

function emailKey(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function phoneKey(value?: string) {
  return (value ?? "").replace(/\D/g, "");
}

function nameKey(value?: string) {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function studentsAreSame(a: Student, b: Student) {
  if (a.id && b.id && a.id === b.id) return true;
  if (a.userId && b.userId && a.userId === b.userId) return true;
  const email = emailKey(a.email);
  if (email && email === emailKey(b.email)) return true;
  const phone = phoneKey(a.phone);
  if (phone.length >= 10) {
    const other = phoneKey(b.phone);
    if (other === phone || other === `55${phone}` || `55${other}` === phone) return true;
  }
  return false;
}

export function classFingerprint(cls: Pick<ClassSession, "weekday" | "startTime" | "name" | "division">) {
  const time = String(cls.startTime ?? "").slice(0, 5);
  return `${cls.weekday}|${time}|${nameKey(cls.name)}|${cls.division ?? "adult"}`;
}

export function classesAreSame(a: ClassSession, b: ClassSession) {
  if (a.id && b.id && a.id === b.id) return true;
  return classFingerprint(a) === classFingerprint(b);
}

/** Oldest roster row that represents this person. */
export function canonicalStudent(students: Student[], needle: Partial<Student> & { id?: string }) {
  const matches = students.filter((row) => studentsAreSame(row as Student, needle as Student));
  if (!matches.length) return students.find((row) => row.id === needle.id);
  return [...matches].sort((a, b) => a.joinDate.localeCompare(b.joinDate) || a.id.localeCompare(b.id))[0];
}

export function studentAliasIds(student: Student, roster: Student[]) {
  const ids = new Set<string>();
  for (const row of roster) {
    if (!studentsAreSame(row, student)) continue;
    ids.add(row.id);
    if (row.userId) ids.add(row.userId);
  }
  ids.add(student.id);
  if (student.userId) ids.add(student.userId);
  return ids;
}

export function remapStudentIds(local: Student[], remote: Student[]) {
  const map = new Map<string, string>();
  for (const row of local) {
    const hit = canonicalStudent(remote, row) ?? canonicalStudent(local, row);
    if (hit) {
      map.set(row.id, hit.id);
      if (row.userId) map.set(row.userId, hit.id);
    }
  }
  for (const row of remote) {
    map.set(row.id, row.id);
    if (row.userId) map.set(row.userId, row.id);
  }
  return map;
}

export function remapClassIds(local: ClassSession[], remote: ClassSession[]) {
  const map = new Map<string, string>();
  for (const row of local) {
    const hit = remote.find((item) => classesAreSame(item, row)) ?? row;
    map.set(row.id, hit.id);
  }
  for (const row of remote) map.set(row.id, row.id);
  return map;
}

function attendanceRank(row: Attendance) {
  const status = attendanceStatus(row);
  if (status === "validated") return 3;
  if (status === "pending") return 2;
  if (status === "no_show") return 1;
  return 0;
}

export function mergeStudents(local: Student[], remote: Student[]) {
  const merged: Student[] = remote.map((row) => ({ ...row }));
  for (const row of local) {
    const hit = canonicalStudent(merged, row);
    if (hit) {
      const index = merged.findIndex((item) => item.id === hit.id);
      merged[index] = {
        ...hit,
        userId: hit.userId || row.userId,
        email: hit.email || row.email,
        phone: hit.phone || row.phone,
        name: hit.name || row.name,
      };
      continue;
    }
    merged.push(row);
  }
  return merged;
}

export function mergeClasses(local: ClassSession[], remote: ClassSession[]) {
  const merged: ClassSession[] = remote.map((row) => ({ ...row }));
  for (const row of local) {
    const hit = merged.find((item) => classesAreSame(item, row));
    if (hit) continue;
    merged.push(row);
  }
  return merged;
}

export function mergeAttendance(
  local: Attendance[],
  remote: Attendance[],
  studentMap: Map<string, string>,
  classMap: Map<string, string>,
) {
  const remap = (row: Attendance): Attendance => ({
    ...row,
    studentId: studentMap.get(row.studentId) ?? row.studentId,
    classId: classMap.get(row.classId) ?? row.classId,
  });
  const byKey = new Map<string, Attendance>();
  const put = (raw: Attendance) => {
    const row = remap(raw);
    const key = `${row.studentId}|${row.classId}|${row.date}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, row);
      return;
    }
    const next = attendanceRank(row) >= attendanceRank(prev) ? row : prev;
    byKey.set(key, { ...next, id: prev.id || next.id });
  };
  remote.forEach(put);
  local.forEach(put);
  return [...byKey.values()];
}

export function attendanceForStudent(
  student: Student,
  rows: Attendance[],
  roster: Student[],
) {
  const aliases = studentAliasIds(student, roster);
  return rows.find((row) => aliases.has(row.studentId));
}

export function mergeAcademyState(local: AppState, remote: AppState): AppState {
  const students = mergeStudents(local.students, remote.students);
  const classes = mergeClasses(local.classes, remote.classes);
  const studentMap = remapStudentIds(local.students, students);
  const classMap = remapClassIds(local.classes, classes);
  return {
    ...remote,
    session: local.session ?? remote.session,
    academy: {
      ...remote.academy,
      joinCode: local.academy.joinCode || remote.academy.joinCode,
      pixKey: local.academy.pixKey || remote.academy.pixKey,
      pixName: local.academy.pixName || remote.academy.pixName,
    },
    students,
    classes,
    attendance: mergeAttendance(local.attendance, remote.attendance, studentMap, classMap),
  };
}
