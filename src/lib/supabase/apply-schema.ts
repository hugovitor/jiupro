import { promises as dns, setDefaultResultOrder } from "node:dns";
import { Client } from "pg";
import {
  isDirectSupabaseDbHost,
  mapDatabaseConnectError,
  postgresHostname,
} from "@/lib/supabase/database-url";
import { awsRegionFromIpv6 } from "@/lib/supabase/ipv6-region";

setDefaultResultOrder("ipv4first");

const SQL_EDITOR_HINT =
  "Copie o SQL abaixo, cole no SQL Editor do Supabase e clique Run. É o caminho que não depende da porta 5432.";

const POOLER_REGIONS = [
  "us-west-2",
  "sa-east-1",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "eu-north-1",
  "ap-southeast-1",
  "ap-northeast-1",
  "ap-south-1",
  "ca-central-1",
];

function lookupIpv4(hostname: string) {
  return dns.lookup(hostname, { family: 4 }).then((r) => r.address);
}

function directProjectRef(raw: string) {
  const host = postgresHostname(raw);
  const match = host?.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
  return match?.[1] ?? null;
}

function parsePostgresUri(raw: string) {
  const url = new URL(raw);
  return {
    user: decodeURIComponent(url.username || "postgres"),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "") || "postgres"),
    hostname: url.hostname,
    port: Number(url.port || 5432),
  };
}

function isWrongTenant(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return /tenant or user not found|tenant not found/i.test(message);
}

function isBadPassword(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return /password authentication failed|28P01/i.test(message);
}

async function openClient(opts: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}) {
  const ipv4 = await lookupIpv4(opts.host);
  const client = new Client({
    host: ipv4,
    port: opts.port,
    user: opts.user,
    password: opts.password,
    database: opts.database,
    ssl: { rejectUnauthorized: false, servername: opts.host },
    connectionTimeoutMillis: 8000,
  });
  await client.connect();
  return client;
}

async function regionHintFromDirectHost(host: string) {
  try {
    const addresses = await dns.resolve6(host);
    for (const ip of addresses) {
      const region = awsRegionFromIpv6(ip);
      if (region) return region;
    }
  } catch {
    return null;
  }
  return null;
}

function poolerHostsFor(region: string) {
  return [`aws-0-${region}.pooler.supabase.com`, `aws-1-${region}.pooler.supabase.com`];
}

async function connectDirectViaPooler(raw: string) {
  const ref = directProjectRef(raw);
  if (!ref) {
    throw new Error(SQL_EDITOR_HINT);
  }
  const parsed = parsePostgresUri(raw);
  const user = parsed.user.includes(".") ? parsed.user : `${parsed.user}.${ref}`;
  const hint = await regionHintFromDirectHost(parsed.hostname);
  const regions = hint
    ? [hint, ...POOLER_REGIONS.filter((r) => r !== hint)]
    : POOLER_REGIONS;

  let lastErr: unknown;
  let unreachable = 0;
  for (const region of regions) {
    for (const host of poolerHostsFor(region)) {
      try {
        return await openClient({
          host,
          port: 5432,
          user,
          password: parsed.password,
          database: parsed.database,
        });
      } catch (err) {
        lastErr = err;
        if (isBadPassword(err)) throw err;
        const code =
          err && typeof err === "object" && "code" in err
            ? String((err as { code?: unknown }).code ?? "")
            : "";
        if (code === "ETIMEDOUT" || code === "ENETUNREACH" || code === "EHOSTUNREACH") {
          unreachable += 1;
          if (unreachable >= 2) {
            throw new Error(
              "A porta 5432 não sai desta rede. Copie o SQL, cole no SQL Editor e clique Run.",
            );
          }
          continue;
        }
        if (isWrongTenant(err) || code === "ENOTFOUND") continue;
      }
    }
  }
  throw lastErr ?? new Error(SQL_EDITOR_HINT);
}

export async function applyJiuProSchema(databaseUrl: string, sql: string) {
  let client: Client;
  if (isDirectSupabaseDbHost(databaseUrl)) {
    client = await connectDirectViaPooler(databaseUrl);
  } else {
    const parsed = parsePostgresUri(databaseUrl);
    const hostname = postgresHostname(databaseUrl);
    if (!hostname) throw new Error("URI do banco inválida.");
    client = await openClient({
      host: hostname,
      port: parsed.port || 5432,
      user: parsed.user,
      password: parsed.password,
      database: parsed.database,
    });
  }

  try {
    await client.query(sql);
  } finally {
    await client.end().catch(() => undefined);
  }
}

export function schemaApplyError(err: unknown) {
  if (isBadPassword(err)) {
    return "Senha do banco recusada. Confira a URI em Database → Connect (copie de novo se resetou a senha).";
  }
  const message = err instanceof Error ? err.message : String(err);
  if (/SQL Editor/i.test(message)) return message;
  return `${mapDatabaseConnectError(err)} ${SQL_EDITOR_HINT}`;
}

export { SQL_EDITOR_HINT };
