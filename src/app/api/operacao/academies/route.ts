import { NextResponse } from "next/server";
import { normalizeBillingStatus } from "@/lib/billing-status";
import { requireOperator, supabaseAdmin } from "@/lib/operator";
import { academyPlanMeta, isPlanId } from "@/lib/operator-hq";
import type { BillingStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BILLING: BillingStatus[] = [
  "none",
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "canceled",
];

function isBillingStatus(value: string): value is BillingStatus {
  return BILLING.includes(value as BillingStatus);
}

export async function PATCH(request: Request) {
  const auth = await requireOperator(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = supabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: "O banco online não está ligado neste deploy." }, { status: 503 });
  }

  const body = (await request.json()) as {
    id?: string;
    plan?: string;
    billingStatus?: string;
    grant?: boolean;
    lock?: boolean;
  };

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Informe a academia." }, { status: 400 });
  }

  const patch: Record<string, string> = {};
  if (body.plan) {
    if (!isPlanId(body.plan)) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }
    patch.plan = body.plan;
  }
  if (body.grant) patch.billing_status = "active";
  if (body.lock) patch.billing_status = "canceled";
  if (body.billingStatus) {
    if (!isBillingStatus(body.billingStatus)) {
      return NextResponse.json({ error: "Situação de cobrança inválida." }, { status: 400 });
    }
    patch.billing_status = body.billingStatus;
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const { data, error } = await db
    .from("academies")
    .update(patch)
    .eq("id", id)
    .select("id,name,plan,billing_status,stripe_subscription_id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "Academia não encontrada." }, { status: 404 });
  }

  const plan = academyPlanMeta(String(data.plan ?? "academia"));
  return NextResponse.json({
    ok: true,
    id: data.id,
    name: data.name,
    plan: plan.id,
    planLabel: plan.planLabel,
    billingStatus: normalizeBillingStatus(data.billing_status),
    subscribed: Boolean(data.stripe_subscription_id),
    operator: auth.email,
  });
}
