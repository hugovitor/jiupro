import { Client } from "pg";
import { isSupabaseDatabaseUrl, readJiuProSchema } from "@/lib/supabase/schema-file";

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
          "Cole a URI do Postgres do próprio Supabase (Connect → URI). Não use a anon key aqui.",
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

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(sql);
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao aplicar o schema.";
    return Response.json({ error: message }, { status: 502 });
  } finally {
    await client.end().catch(() => undefined);
  }
}
