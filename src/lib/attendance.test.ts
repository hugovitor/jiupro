import { describe, expect, it } from "vitest";
import {
  attendanceStatus,
  classHeadcount,
  classPhase,
  isLateCheckIn,
  isOnRoster,
  studentCanSelfCheckIn,
} from "./attendance";
import type { Attendance, ClassSession } from "./types";

function klass(startTime: string, durationMin = 90): ClassSession {
  return {
    id: "c1",
    academyId: "a1",
    name: "Adultos Gi",
    weekday: 3,
    startTime,
    durationMin,
    instructorId: "u1",
    division: "adult",
    gi: true,
    capacity: 24,
  };
}

/** Relógio de parede em America/Sao_Paulo (UTC-3 neste dia). */
function at(hour: number, minute: number) {
  const utc = hour + 3;
  const day = utc >= 24 ? 18 : 17;
  const hourUtc = utc % 24;
  return new Date(
    `2026-09-${String(day).padStart(2, "0")}T${String(hourUtc).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`,
  );
}

describe("presença", () => {
  it("abre a chamada 20 min antes e fecha 15 min depois do fim", () => {
    const session = klass("19:30");
    expect(classPhase(session, at(19, 5))).toBe("upcoming");
    expect(classPhase(session, at(19, 15))).toBe("open");
    expect(classPhase(session, at(19, 40))).toBe("live");
    expect(classPhase(session, at(21, 5))).toBe("grace");
    expect(classPhase(session, at(21, 50))).toBe("closed");
    expect(studentCanSelfCheckIn(session, at(21, 50))).toBe(false);
    expect(studentCanSelfCheckIn(session, at(19, 40))).toBe(true);
  });

  it("marca atraso depois de 10 min de aula", () => {
    const session = klass("19:30");
    expect(isLateCheckIn(session, "2026-09-17T22:35:00.000Z")).toBe(false);
    expect(isLateCheckIn(session, "2026-09-17T22:45:00.000Z")).toBe(true);
  });

  it("app sem validar fica pendente e ainda ocupa vaga", () => {
    const pending: Attendance = {
      id: "att1",
      academyId: "a1",
      studentId: "s1",
      classId: "c1",
      date: "2026-09-17",
      checkedInAt: "2026-09-17T22:30:00.000Z",
      method: "app",
      status: "pending",
    };
    expect(attendanceStatus(pending)).toBe("pending");
    expect(isOnRoster(pending)).toBe(true);
    expect(classHeadcount([pending], [], "c1", "2026-09-17")).toBe(1);
    expect(
      classHeadcount([pending], [{ classId: "c1", date: "2026-09-17" }], "c1", "2026-09-17"),
    ).toBe(2);
  });
});
