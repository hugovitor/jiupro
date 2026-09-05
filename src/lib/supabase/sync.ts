import { createSupabaseBrowserClient } from "./client";
import { DEMO_ACADEMY_ID } from "../seed";
import { stripSession } from "../vault";
import type { AppState } from "../types";

type AcademyRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  instagram: string | null;
  pix_key: string | null;
  pix_name: string | null;
  plan: string;
  monthly_goal: number | null;
  drop_in_fee: number | null;
  app_state: AppState | null;
};

export async function registerRemoteAcademy(input: {
  email: string;
  password: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  plan: string;
  ownerName: string;
}): Promise<{ academyId?: string; ownerId?: string; error?: string; pendingEmail?: boolean }> {
  const client = createSupabaseBrowserClient();
  if (!client) return {};

  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
  });
  if (error) return { error: error.message };

  const ownerId = data.user?.id;
  if (!data.session) {
    return { ownerId, pendingEmail: true };
  }

  const { data: academyId, error: rpcError } = await client.rpc("register_academy", {
    p_name: input.name,
    p_slug: input.slug,
    p_city: input.city,
    p_state: input.state,
    p_plan: input.plan,
    p_owner_name: input.ownerName,
  });
  if (rpcError) return { ownerId, error: rpcError.message };
  return { academyId: academyId as string, ownerId };
}

export async function signInRemote(email: string, password: string) {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "offline" as const };

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: error?.message ?? "login" };

  const { data: profile } = await client
    .from("profiles")
    .select("id, academy_id, name, role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) return { userId: data.user.id, missingProfile: true as const };

  const { data: row } = await client
    .from("academies")
    .select(
      "id, name, slug, city, state, address, phone, instagram, pix_key, pix_name, plan, monthly_goal, drop_in_fee, app_state",
    )
    .eq("id", profile.academy_id)
    .maybeSingle();

  return {
    userId: data.user.id,
    profile,
    academy: row as AcademyRow | null,
  };
}

export async function finishRemoteRegister(input: {
  name: string;
  slug: string;
  city: string;
  state: string;
  plan: string;
  ownerName: string;
}) {
  const client = createSupabaseBrowserClient();
  if (!client) return { error: "offline" };
  const { data: academyId, error } = await client.rpc("register_academy", {
    p_name: input.name,
    p_slug: input.slug,
    p_city: input.city,
    p_state: input.state,
    p_plan: input.plan,
    p_owner_name: input.ownerName,
  });
  if (error) return { error: error.message };
  return { academyId: academyId as string };
}

export function scheduleRemotePush(state: AppState) {
  if (typeof window === "undefined") return;
  if (state.academy.id === DEMO_ACADEMY_ID) return;
  const client = createSupabaseBrowserClient();
  if (!client) return;
  const handle = window.setTimeout(() => {
    void client
      .from("academies")
      .update({
        name: state.academy.name,
        slug: state.academy.slug,
        city: state.academy.city,
        state: state.academy.state,
        address: state.academy.address,
        phone: state.academy.phone,
        instagram: state.academy.instagram,
        pix_key: state.academy.pixKey,
        pix_name: state.academy.pixName,
        plan: state.academy.plan,
        monthly_goal: state.academy.monthlyGoal,
        drop_in_fee: state.academy.dropInFee,
        app_state: stripSession(state),
      })
      .eq("id", state.academy.id)
      .then(({ error }) => {
        if (error) console.warn("JiuPro: falha ao gravar academia no Supabase.", error.message);
      });
  }, 700);
  return () => window.clearTimeout(handle);
}

export function applyRemoteAcademy(row: AcademyRow, session: AppState["session"]): AppState | null {
  if (row.app_state?.academy) {
    return {
      ...row.app_state,
      academy: {
        ...row.app_state.academy,
        id: row.id,
        name: row.name,
        slug: row.slug,
        city: row.city ?? row.app_state.academy.city,
        state: row.state ?? row.app_state.academy.state,
        pixKey: row.pix_key ?? row.app_state.academy.pixKey,
        pixName: row.pix_name ?? row.app_state.academy.pixName,
        plan: (row.plan as AppState["academy"]["plan"]) ?? row.app_state.academy.plan,
      },
      session,
    };
  }
  return null;
}
