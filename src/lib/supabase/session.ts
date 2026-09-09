import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";

function storageKeyFromUrl(url: string) {
  try {
    return `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  } catch {
    return null;
  }
}

function parseCookies(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const out: Record<string, string> = {};
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const name = trimmed.slice(0, i);
    let value = trimmed.slice(i + 1);
    try {
      value = decodeURIComponent(value);
    } catch {
      /* keep raw */
    }
    out[name] = value;
  }
  return out;
}

function combineChunks(key: string, cookies: Record<string, string>) {
  if (cookies[key]) return cookies[key];
  const parts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const value = cookies[`${key}.${i}`];
    if (value === undefined) break;
    parts.push(value);
  }
  return parts.length ? parts.join("") : null;
}

function decodeCookiePayload(raw: string) {
  const value = raw.startsWith("base64-") ? raw.slice("base64-".length) : raw;
  if (raw.startsWith("base64-")) {
    const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const binary = atob(b64 + pad);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return value;
}

function tokensFromPayload(raw: string) {
  try {
    const parsed = JSON.parse(raw) as {
      access_token?: string;
      refresh_token?: string;
      currentSession?: { access_token?: string; refresh_token?: string };
    };
    const session = parsed.access_token ? parsed : parsed.currentSession;
    if (session?.access_token && session?.refresh_token) {
      return {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function readSupabaseSessionFromCookies() {
  if (typeof document === "undefined") return null;
  const cfg = getSupabasePublicConfig();
  if (!cfg) return null;
  const key = storageKeyFromUrl(cfg.url);
  if (!key) return null;
  const combined = combineChunks(key, parseCookies());
  if (!combined) return null;
  try {
    return tokensFromPayload(decodeCookiePayload(combined));
  } catch {
    return null;
  }
}

function waitForAccessToken(client: SupabaseClient, ms: number) {
  return new Promise<string | null>((resolve) => {
    let done = false;
    let unsubscribe = () => {};
    const finish = (token: string | null) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      unsubscribe();
      resolve(token);
    };
    const timer = window.setTimeout(() => finish(null), ms);
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      const token = session?.access_token;
      if (token) finish(token);
    });
    unsubscribe = () => sub.subscription.unsubscribe();
  });
}

export async function ensureBrowserAuthSession(client: SupabaseClient) {
  const first = (await client.auth.getSession()).data.session?.access_token;
  if (first) return first;

  const fromCookies = readSupabaseSessionFromCookies();
  if (fromCookies) {
    const { data } = await client.auth.setSession(fromCookies);
    if (data.session?.access_token) return data.session.access_token;
  }

  const waited = await waitForAccessToken(client, 600);
  if (waited) return waited;

  const refreshed = (await client.auth.refreshSession()).data.session?.access_token;
  return refreshed ?? null;
}
