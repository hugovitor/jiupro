const OWNER_NEXT = new Set([
  "/academia",
  "/academia/configuracoes",
  "/planos",
  "/operacao",
  "/academia/presenca",
  "/academia/cobrancas",
  "/academia/atestados",
]);

const INSTRUCTOR_NEXT = new Set([
  "/academia",
  "/academia/presenca",
  "/academia/atestados",
  "/academia/alunos",
]);

export function ownerDestination(next: string | null | undefined, role: string) {
  if (role === "student") return "/aluno";
  if (role === "instructor") {
    if (next && INSTRUCTOR_NEXT.has(next)) {
      return next === "/academia" ? "/academia/presenca" : next;
    }
    return "/academia/presenca";
  }
  if (next && OWNER_NEXT.has(next)) return next;
  return "/academia";
}
