import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function operatorHeaders(): Promise<HeadersInit> {
  const client = createSupabaseBrowserClient();
  if (!client) return {};
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
