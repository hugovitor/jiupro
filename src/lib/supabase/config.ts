const STORAGE = "jiupro.supabase.v1";

export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (envUrl && envKey) return { url: envUrl, anonKey: envKey };
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SupabasePublicConfig;
    if (parsed.url?.startsWith("http") && parsed.anonKey.length > 20) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveSupabasePublicConfig(cfg: SupabasePublicConfig | null) {
  if (typeof window === "undefined") return;
  if (!cfg) localStorage.removeItem(STORAGE);
  else localStorage.setItem(STORAGE, JSON.stringify(cfg));
  window.dispatchEvent(new Event("jiupro-supabase"));
}

export function isSupabaseConfigured() {
  return Boolean(getSupabasePublicConfig());
}

export function configSource(): "env" | "local" | null {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (envUrl && envKey) return "env";
  if (getSupabasePublicConfig()) return "local";
  return null;
}
