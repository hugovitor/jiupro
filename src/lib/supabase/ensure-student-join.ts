import { applyJiuProSchema } from "@/lib/supabase/apply-schema";
import { STUDENT_JOIN_SQL } from "@/lib/student-join";

const URI_KEYS = [
  "DATABASE_URL",
  "SUPABASE_DB_URL",
  "POSTGRES_URL",
  "SUPABASE_DATABASE_URL",
  "DIRECT_URL",
] as const;

export function postgresUriFromEnv() {
  for (const key of URI_KEYS) {
    const value = process.env[key]?.trim() ?? "";
    if (/^postgres(ql)?:\/\//i.test(value)) return value;
  }
  return "";
}

let applied = false;
let inFlight: Promise<boolean> | null = null;

export async function ensureStudentJoinSchema(): Promise<{
  ok: boolean;
  applied: boolean;
  reason?: "missing-uri" | "apply-failed";
}> {
  if (applied) return { ok: true, applied: false };
  const uri = postgresUriFromEnv();
  if (!uri) return { ok: false, applied: false, reason: "missing-uri" };

  if (!inFlight) {
    inFlight = applyJiuProSchema(uri, STUDENT_JOIN_SQL)
      .then(() => {
        applied = true;
        return true;
      })
      .catch(() => false)
      .finally(() => {
        inFlight = null;
      });
  }

  const ok = await inFlight;
  if (!ok) return { ok: false, applied: false, reason: "apply-failed" };
  return { ok: true, applied: true };
}

export function isMissingStudentJoinRpc(message?: string) {
  return /lookup_academy_join|search_academy_join|join_academy_as_student|PGRST202|does not exist|schema cache/i.test(
    message ?? "",
  );
}
