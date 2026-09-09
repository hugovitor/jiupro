import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig, isSupabaseConfigured as configured } from "./config";

export { isSupabaseConfigured } from "./config";

let cached: SupabaseClient | null = null;
let cachedKey = "";

if (typeof window !== "undefined") {
  window.addEventListener("jiupro-supabase", () => {
    cached = null;
    cachedKey = "";
  });
}

export function createSupabaseBrowserClient() {
  if (!configured()) return null;
  const cfg = getSupabasePublicConfig();
  if (!cfg) return null;
  const key = `${cfg.url}|${cfg.anonKey.slice(0, 12)}`;
  if (cached && cachedKey === key) return cached;
  const inBrowser = typeof window !== "undefined";
  cached = createClient(cfg.url, cfg.anonKey, {
    auth: {
          persistSession: inBrowser,
          autoRefreshToken: inBrowser,
          detectSessionInUrl: inBrowser,
          storage: inBrowser ? window.localStorage : undefined,
    },
  });
  cachedKey = key;
  return cached;
}
