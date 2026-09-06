export const POOLER_URI_HINT =
  "Se a porta 5432 estiver bloqueada, cole o SQL no SQL Editor do Supabase e clique Run.";

export function postgresHostname(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      return null;
    }
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isSupabaseDatabaseUrl(raw: string) {
  const host = postgresHostname(raw);
  if (!host) return false;
  return host.endsWith(".supabase.co") || host.endsWith(".pooler.supabase.com");
}

/** Direct connections (`db.<ref>.supabase.co`) are IPv6-only on current Supabase projects. */
export function isDirectSupabaseDbHost(raw: string) {
  const host = postgresHostname(raw);
  return Boolean(host && host.startsWith("db.") && host.endsWith(".supabase.co"));
}

function errorCode(err: unknown) {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code?: unknown }).code ?? "");
  }
  return "";
}

export function mapDatabaseConnectError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const code = errorCode(err);

  const ipv6Unreachable =
    code === "ENETUNREACH" ||
    code === "EHOSTUNREACH" ||
    code === "EAI_ADDRFAMILY" ||
    /ENETUNREACH|EHOSTUNREACH|EAI_ADDRFAMILY/i.test(message) ||
    (/:[0-9a-f]{1,4}:[0-9a-f]{0,4}/i.test(message) && /5432/.test(message));

  if (ipv6Unreachable || isDirectSupabaseDbHost(message)) {
    return `A rede daqui não alcança o Postgres em IPv6. ${POOLER_URI_HINT}`;
  }

  if (code === "ENOTFOUND" || /ENOTFOUND|getaddrinfo/i.test(message)) {
    return `Host do banco não encontrado. ${POOLER_URI_HINT}`;
  }

  if (code === "ETIMEDOUT" || /ETIMEDOUT/i.test(message)) {
    return `Tempo esgotado na porta 5432. ${POOLER_URI_HINT}`;
  }

  return message || "Falha ao aplicar o schema.";
}
