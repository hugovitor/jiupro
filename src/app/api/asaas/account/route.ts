import { AsaasApiError, createAsaasClient } from "@/lib/asaas/client";
import { resolveAsaasKey } from "@/lib/asaas/env";

export const runtime = "nodejs";

export async function GET() {
  const key = resolveAsaasKey();
  return Response.json({
    configured: Boolean(key),
    environment: key.startsWith("$aact_prod_") ? "production" : "sandbox",
  });
}

export async function POST(req: Request) {
  let body: { apiKey?: string } = {};
  try {
    body = (await req.json()) as { apiKey?: string };
  } catch {
    body = {};
  }
  const key = resolveAsaasKey(body.apiKey);
  if (!key) {
    return Response.json(
      { error: "Cole a API key do sandbox ($aact_hmlg_…) em Configurações ou no .env." },
      { status: 400 },
    );
  }
  try {
    const client = createAsaasClient(key);
    const account = await client.account();
    return Response.json({
      ok: true,
      environment: client.env,
      name: account.name,
      email: account.email,
    });
  } catch (err) {
    const message = err instanceof AsaasApiError ? err.message : "Falha ao falar com o Asaas.";
    const status = err instanceof AsaasApiError ? err.status : 502;
    return Response.json({ error: message }, { status });
  }
}
