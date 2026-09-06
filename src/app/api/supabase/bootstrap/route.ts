import { applyJiuProSchema, schemaApplyError } from "@/lib/supabase/apply-schema";
import { isSupabaseDatabaseUrl } from "@/lib/supabase/database-url";
import { readJiuProSchema } from "@/lib/supabase/schema-file";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let databaseUrl = "";
  try {
    const body = (await req.json()) as { databaseUrl?: string };
    databaseUrl = String(body.databaseUrl ?? "").trim();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (!isSupabaseDatabaseUrl(databaseUrl)) {
    return Response.json(
      {
        error:
          "Cole a URI do Postgres (Connect). Direct também serve — convertemos para o pooler IPv4. Não use a anon key aqui.",
      },
      { status: 400 },
    );
  }

  let sql: string;
  try {
    sql = await readJiuProSchema();
  } catch {
    return Response.json({ error: "Schema SQL não encontrado." }, { status: 500 });
  }

  try {
    await applyJiuProSchema(databaseUrl, sql);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: schemaApplyError(err) }, { status: 502 });
  }
}
