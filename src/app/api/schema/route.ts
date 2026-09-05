import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET() {
  try {
    const sql = await readFile(join(process.cwd(), "supabase/schema.sql"), "utf8");
    return new Response(sql, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("-- schema.sql não encontrado neste deploy.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
