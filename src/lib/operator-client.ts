import { isOperatorEmail } from "@/lib/operator";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureBrowserAuthSession } from "@/lib/supabase/session";
import { signInRemote } from "@/lib/supabase/sync";
import { passwordFor } from "@/lib/vault";

export async function operatorAccessToken(email?: string | null) {
  const client = createSupabaseBrowserClient();
  if (!client) return null;

  const existing = await ensureBrowserAuthSession(client);
  if (existing) return existing;

  const needle = email?.trim().toLowerCase() ?? "";
  if (!needle || !isOperatorEmail(needle)) return null;
  const password = passwordFor(needle);
  if (!password) return null;

  const remote = await signInRemote(needle, password);
  if ("error" in remote && remote.error === "offline") return null;
  return (await client.auth.getSession()).data.session?.access_token ?? null;
}

export async function operatorHeaders(email?: string | null): Promise<HeadersInit> {
  const token = await operatorAccessToken(email);
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
