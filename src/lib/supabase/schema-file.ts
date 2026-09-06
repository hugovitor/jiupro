import { readFile } from "node:fs/promises";
import { join } from "node:path";

export { isSupabaseDatabaseUrl } from "@/lib/supabase/database-url";

export async function readJiuProSchema() {
  return readFile(join(process.cwd(), "supabase/schema.sql"), "utf8");
}
