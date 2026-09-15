import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/operator";

export function bearerToken(request: Request) {
  return (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
}

type AuthFail = { ok: false; error: string; status: 401 | 403 | 503 };
type AuthUser = { ok: true; user: User };
type AuthStaff = {
  ok: true;
  user: User;
  academyId: string;
  role: "owner" | "instructor";
  admin: NonNullable<ReturnType<typeof supabaseAdmin>>;
};

export async function userFromToken(token: string): Promise<User | null | { missingConfig: true }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return { missingConfig: true };
  const client = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user?.id) return null;
  return data.user;
}

export async function requireUser(request: Request): Promise<AuthUser | AuthFail> {
  const token = bearerToken(request);
  if (!token) return { ok: false, error: "Entre de novo.", status: 401 };
  const user = await userFromToken(token);
  if (user && "missingConfig" in user) {
    return { ok: false, error: "Conta online não está ligada neste deploy.", status: 503 };
  }
  if (!user?.id) return { ok: false, error: "Entre de novo.", status: 401 };
  return { ok: true, user };
}

export async function requireAcademyStaff(request: Request): Promise<AuthStaff | AuthFail> {
  const auth = await requireUser(request);
  if (!auth.ok) return auth;
  const admin = supabaseAdmin();
  if (!admin) {
    return { ok: false, error: "Banco não está ligado neste deploy.", status: 503 };
  }
  const profile = await admin
    .from("profiles")
    .select("academy_id, role")
    .eq("id", auth.user.id)
    .maybeSingle();
  const role = String(profile.data?.role ?? "");
  const academyId = String(profile.data?.academy_id ?? "");
  if (!academyId || (role !== "owner" && role !== "instructor")) {
    return { ok: false, error: "Só a equipe da academia pode fazer isso.", status: 403 };
  }
  return { ok: true, user: auth.user, academyId, role, admin };
}

export async function requireAcademyOwner(request: Request): Promise<AuthStaff | AuthFail> {
  const staff = await requireAcademyStaff(request);
  if (!staff.ok) return staff;
  if (staff.role !== "owner") {
    return { ok: false, error: "Só o dono da academia pode fazer isso.", status: 403 };
  }
  return staff;
}

export type { AuthFail, AuthStaff, AuthUser, SupabaseClient };
