export type RosterClaimRow = {
  id: string;
  user_id?: string | null;
  email?: string | null;
};

export type RosterClaim =
  | { ok: true; studentId: string }
  | { ok: false; error: string }
  | { ok: true; studentId: null };

/** Ficha só por user_id ou e-mail. WhatsApp não reivindica. */
export function matchRosterClaim(
  roster: RosterClaimRow[],
  input: { userId: string; email: string },
): RosterClaim {
  const email = input.email.trim().toLowerCase();
  let studentId: string | null = null;
  let claimed: string | null = null;

  const byUser = roster.find((row) => String(row.user_id ?? "") === input.userId);
  if (byUser?.id) {
    studentId = String(byUser.id);
    claimed = byUser.user_id ? String(byUser.user_id) : null;
  }

  if (!studentId && email) {
    const emailHit = roster.find(
      (row) => String(row.email ?? "").trim().toLowerCase() === email,
    );
    if (emailHit?.id) {
      studentId = String(emailHit.id);
      claimed = emailHit.user_id ? String(emailHit.user_id) : null;
    }
  }

  if (claimed && claimed !== input.userId) {
    return { ok: false, error: "Essa ficha já tem acesso. Entre com o e-mail e a senha que você criou." };
  }
  if (!studentId) return { ok: true, studentId: null };
  return { ok: true, studentId };
}
