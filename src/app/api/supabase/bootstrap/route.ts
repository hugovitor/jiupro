import dns from "node:dns";
import { Client } from "pg";
import {
  directDbHostError,
  isDirectSupabaseDbHost,
  isSupabaseDatabaseUrl,
  mapDatabaseConnectError,
  postgresHostname,
} from "@/lib/supabase/database-url";
import { readJiuProSchema } from "@/lib/supabase/schema-file";

export const runtime = "nodejs";

dns.setDefaultResultOrder("ipv4first");

function lookupIpv4Address(hostname: string) {
  return new Promise<string>((resolve, reject) => {
    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err) reject(err);
      else resolve(address);
    });
  });
}

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
          "Cole a URI do Postgres do próprio Supabase (Connect → Session pooler). Não use a anon key aqui.",
      },
      { status: 400 },
    );
  }

  if (isDirectSupabaseDbHost(databaseUrl)) {
    return Response.json({ error: directDbHostError() }, { status: 400 });
  }

  let sql: string;
  try {
    sql = await readJiuProSchema();
  } catch {
    return Response.json({ error: "Schema SQL não encontrado." }, { status: 500 });
  }

  const hostname = postgresHostname(databaseUrl);
  if (!hostname) {
    return Response.json({ error: "URI do banco inválida." }, { status: 400 });
  }

  let ipv4: string;
  try {
    ipv4 = await lookupIpv4Address(hostname);
  } catch (err) {
    return Response.json({ error: mapDatabaseConnectError(err) }, { status: 502 });
  }

  const parsed = new URL(databaseUrl);
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, "") || "postgres");

  const client = new Client({
    host: ipv4,
    port: Number(parsed.port || 5432),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    ssl: { rejectUnauthorized: false, servername: hostname },
  });

  try {
    await client.connect();
    await client.query(sql);
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: mapDatabaseConnectError(err) }, { status: 502 });
  } finally {
    await client.end().catch(() => undefined);
  }
}
