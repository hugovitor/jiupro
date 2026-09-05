import { readJiuProSchema } from "@/lib/supabase/schema-file";

export async function GET() {
  try {
    const sql = await readJiuProSchema();
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
