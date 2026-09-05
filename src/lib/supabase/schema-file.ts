import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function readJiuProSchema() {
  return readFile(join(process.cwd(), "supabase/schema.sql"), "utf8");
}

export function isSupabaseDatabaseUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      return false;
    }
    const host = url.hostname.toLowerCase();
    return (
      host.endsWith(".supabase.co") ||
      host.endsWith(".pooler.supabase.com")
    );
  } catch {
    return false;
  }
}
