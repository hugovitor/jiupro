import "server-only";

const DEFAULT_OPERATORS = ["hugovitormnunes@gmail.com"];

export function operatorEmails() {
  const extra = [
    process.env.JIUPRO_OPERATOR_EMAILS,
    process.env.TATAMEX_OPERATOR_EMAILS,
    process.env.PONTEIRA_OPERATOR_EMAILS,
  ]
    .flatMap((value) => (value ?? "").split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_OPERATORS, ...extra]);
}

export function isOperatorEmail(email?: string | null) {
  if (!email) return false;
  return operatorEmails().has(email.trim().toLowerCase());
}
