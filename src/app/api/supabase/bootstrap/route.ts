import { applyJiuProSchema, schemaApplyError } from "@/lib/supabase/apply-schema";
import { requireUser } from "@/lib/api-auth";
import { isSupabaseDatabaseUrl } from "@/lib/supabase/database-url";
import { postgresUriFromEnv } from "@/lib/supabase/ensure-student-join";
import { readJiuProSchema } from "@/lib/supabase/schema-file";
import { deploymentEnv } from "@/lib/runtime";

export const runtime = "nodejs";

function allowBrowserDatabaseUri() {
  return deploymentEnv() === "development";
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  let clientUri = "";
  try {
    const body = (await req.json()) as { databaseUrl?: string };
    clientUri = String(body.databaseUrl ?? "").trim();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (clientUri && !allowBrowserDatabaseUri()) {
    return Response.json(
      {
        error:
          "Em produção o schema só aplica com DATABASE_URL no servidor, ou no SQL Editor do Supabase.",
      },
      { status: 403 },
    );
  }

  const databaseUrl = postgresUriFromEnv() || (allowBrowserDatabaseUri() ? clientUri : "");
  if (!isSupabaseDatabaseUrl(databaseUrl)) {
    return Response.json(
      {
        error: allowBrowserDatabaseUri()
          ? "Cole a URI do Postgres (Connect) só em desenvolvimento. Direct também serve."
          : "O schema deste deploy aplica-se no servidor. Fale no WhatsApp de suporte ou rode o SQL no dashboard.",
      },
      { status: allowBrowserDatabaseUri() ? 400 : 503 },
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
