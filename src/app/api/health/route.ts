import { publicAppUrl } from "@/lib/app-url";
import { deploymentEnv } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );

  return Response.json(
    {
      ok: true,
      service: "jiupro",
      time: new Date().toISOString(),
      env: deploymentEnv(),
      url: publicAppUrl(),
      persistence: supabase ? "supabase" : "browser",
      payments: {
        asaas: Boolean(process.env.ASAAS_API_KEY?.trim()),
        stripe: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
