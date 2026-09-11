import { applyJiuProSchema } from "@/lib/supabase/apply-schema";
import { postgresUriFromEnv } from "@/lib/supabase/ensure-student-join";

export const ATTENDANCE_STATUS_SQL = `
alter table public.attendance add column if not exists status text not null default 'validated';
alter table public.attendance add column if not exists validated_at timestamptz;
alter table public.attendance add column if not exists validated_by uuid;
notify pgrst, 'reload schema';
`;

const SCHEMA_VERSION = "2026-09-11-attendance-status";
let appliedVersion = "";
let inFlight: Promise<boolean> | null = null;

export function isMissingAttendanceStatusColumn(message?: string) {
  const msg = message ?? "";
  if (!/status|validated_at|validated_by/i.test(msg)) return false;
  return /PGRST204|schema cache|could not find|does not exist|42703|attendance\.status/i.test(msg);
}

let statusColumn: boolean | null = null;

export function attendanceStatusKnown() {
  return statusColumn;
}

export function rememberAttendanceStatusColumn(exists: boolean) {
  statusColumn = exists;
}

export async function ensureAttendanceSchema(): Promise<{
  ok: boolean;
  applied: boolean;
  reason?: "missing-uri" | "apply-failed";
}> {
  if (appliedVersion === SCHEMA_VERSION) return { ok: true, applied: false };
  const uri = postgresUriFromEnv();
  if (!uri) return { ok: false, applied: false, reason: "missing-uri" };

  if (!inFlight) {
    inFlight = applyJiuProSchema(uri, ATTENDANCE_STATUS_SQL)
      .then(() => {
        appliedVersion = SCHEMA_VERSION;
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
