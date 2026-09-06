export type AsaasEnvironment = "sandbox" | "production";

export function asaasEnvironmentFromKey(key: string): AsaasEnvironment {
  if (key.startsWith("$aact_prod_")) return "production";
  return "sandbox";
}

export function asaasEnvironment(): AsaasEnvironment {
  const forced = process.env.ASAAS_ENV?.trim().toLowerCase();
  if (forced === "production" || forced === "sandbox") return forced;
  const key = process.env.ASAAS_API_KEY?.trim() ?? "";
  return asaasEnvironmentFromKey(key);
}

export function asaasBaseUrl(env: AsaasEnvironment = asaasEnvironment()) {
  return env === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";
}

export function asaasApiKeyFromEnv() {
  return process.env.ASAAS_API_KEY?.trim() || "";
}

export function asaasWebhookToken() {
  return process.env.ASAAS_WEBHOOK_TOKEN?.trim() || "";
}

export function resolveAsaasKey(requestKey?: string) {
  return (requestKey?.trim() || asaasApiKeyFromEnv()).trim();
}
