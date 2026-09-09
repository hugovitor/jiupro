const OWNER_NEXT = new Set([
  "/academia",
  "/academia/configuracoes",
  "/planos",
]);

export function ownerDestination(next: string | null | undefined, role: string) {
  if (role === "student") return "/aluno";
  if (next && OWNER_NEXT.has(next)) return next;
  return "/academia";
}
