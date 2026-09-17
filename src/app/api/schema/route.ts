import { requireOperator } from "@/lib/operator";
import { readJiuProSchema } from "@/lib/supabase/schema-file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireOperator(request);
  if ("error" in auth) {
    return new Response(auth.error, {
      status: auth.status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

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
