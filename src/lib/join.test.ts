import { describe, expect, it } from "vitest";
import { kidsGuardianRequiredError, resolvedEnrollmentDivision } from "./kids-enrollment";
import { canAddStudent, joinStudentCapMessage, studentLimitForPlan } from "./plan-access";
import { matchRosterClaim } from "./roster-claim";
import { canCreateAnotherHouse, mapHouseMembership, routeForRole, staffOfHouse } from "./memberships";

describe("join · ficha", () => {
  it("amarra pelo e-mail livre e recusa WhatsApp como identidade", () => {
    const roster = [
      { id: "s1", user_id: null, email: "joao@casa.jj", phone: "11999990000" },
    ];
    expect(matchRosterClaim(roster, { userId: "u1", email: "joao@casa.jj" })).toEqual({
      ok: true,
      studentId: "s1",
    });
    expect(matchRosterClaim(roster, { userId: "u2", email: "outro@casa.jj" })).toEqual({
      ok: true,
      studentId: null,
    });
  });

  it("não deixa outro usuário tomar ficha já reivindicada", () => {
    const hit = matchRosterClaim(
      [{ id: "s1", user_id: "u1", email: "joao@casa.jj" }],
      { userId: "u2", email: "joao@casa.jj" },
    );
    expect(hit.ok).toBe(false);
    if (!hit.ok) expect(hit.error).toMatch(/já tem acesso/i);
  });

  it("respeita o teto do plano no cadastro do aluno", () => {
    expect(studentLimitForPlan("essencial")).toBe(50);
    expect(studentLimitForPlan("academia")).toBe(200);
    expect(studentLimitForPlan("equipe")).toBeNull();
    expect(
      canAddStudent({ id: "ac1", plan: "essencial" }, 50),
    ).toBe(false);
    expect(joinStudentCapMessage(50)).toMatch(/limite de 50/);
  });

  it("kids exige responsável", () => {
    expect(
      kidsGuardianRequiredError({ division: "kids", guardianName: "" }),
    ).toMatch(/responsável/);
    expect(
      resolvedEnrollmentDivision({ birthDate: "2018-05-01" }),
    ).toBe("kids");
    expect(
      kidsGuardianRequiredError({
        division: "kids",
        guardianName: "Maria Silva",
      }),
    ).toBeNull();
  });

  it("equipe da casa não entra como aluno nela", () => {
    expect(
      staffOfHouse(
        [
          { id: "ac1", role: "owner" },
          { id: "ac2", role: "student" },
        ],
        "ac1",
      ),
    ).toBe(true);
    expect(
      staffOfHouse([{ id: "ac1", role: "owner" }], "ac2"),
    ).toBe(false);
  });

  it("mesmo login troca de unidade e abre outra casa", () => {
    expect(canCreateAnotherHouse("owner")).toBe(true);
    expect(canCreateAnotherHouse("student")).toBe(false);
    expect(canCreateAnotherHouse("student", [{ role: "owner" }])).toBe(true);
    expect(routeForRole("student")).toBe("/aluno");
    expect(routeForRole("instructor")).toBe("/academia");
    expect(
      mapHouseMembership({
        id: "ac2",
        name: "Filial Asa Norte",
        slug: "asa-norte",
        city: "Brasília",
        state: "DF",
        role: "owner",
      }),
    ).toMatchObject({ id: "ac2", role: "owner", name: "Filial Asa Norte" });
    expect(mapHouseMembership({ id: "", role: "owner" })).toBeNull();
  });
});
