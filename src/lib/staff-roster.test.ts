import { describe, expect, it } from "vitest";
import { dropStaffFromRoster, isStaffRole, preferredSessionRole } from "./staff-roster";

describe("equipe · professor não vira aluno", () => {
  it("reconhece dono e professor como equipe", () => {
    expect(isStaffRole("owner")).toBe(true);
    expect(isStaffRole("instructor")).toBe(true);
    expect(isStaffRole("student")).toBe(false);
  });

  it("tira da lista de alunos quem é professor pelo userId ou e-mail", () => {
    const roster = dropStaffFromRoster(
      [
        { id: "s1", userId: "u_prof", email: "prof@casa.jj", name: "Rafa" },
        { id: "s2", userId: "u_aluno", email: "joao@casa.jj", name: "João" },
        { id: "s3", userId: "", email: "ana@casa.jj", name: "Ana" },
      ],
      [
        { id: "u_prof", email: "prof@casa.jj", role: "instructor" },
        { id: "u_ana", email: "ana@casa.jj", role: "instructor" },
        { id: "u_joao", email: "joao@casa.jj", role: "student" },
      ],
    );
    expect(roster.map((row) => row.id)).toEqual(["s2"]);
  });

  it("no login, o papel da equipe nesta casa ganha do perfil aluno", () => {
    expect(
      preferredSessionRole(
        "student",
        [
          { id: "ac1", role: "instructor" },
          { id: "ac2", role: "student" },
        ],
        "ac1",
      ),
    ).toBe("instructor");
    expect(
      preferredSessionRole("student", [{ id: "ac1", role: "student" }], "ac1"),
    ).toBe("student");
    expect(
      preferredSessionRole("student", [{ id: "ac2", role: "instructor" }], "ac1"),
    ).toBe("instructor");
    expect(preferredSessionRole("owner", [], "ac1")).toBe("owner");
  });
});
