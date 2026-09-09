import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function asPlanId(value: string | undefined | null): PlanId | null {
  if (!value) return null;
  return PLANS.some((plan) => plan.id === value) ? (value as PlanId) : null;
}

async function applyPlan(planId: PlanId, academyId?: string | null) {
  if (!academyId) return;
  const db = supabaseAdmin();
  if (!db) return;
  await db.from("academies").update({ plan: planId }).eq("id", academyId);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json({ received: true, demo: true });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const planId = asPlanId(session.metadata?.planId);
      const academyId = session.metadata?.academyId;
      if (academyId) {
        const db = supabaseAdmin();
        if (db) {
          await db
            .from("academies")
            .update({
              ...(planId ? { plan: planId } : {}),
              stripe_customer_id:
                typeof session.customer === "string" ? session.customer : null,
              stripe_subscription_id:
                typeof session.subscription === "string" ? session.subscription : null,
            })
            .eq("id", academyId);
        }
      }
    }
    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object;
      const planId = asPlanId(subscription.metadata?.planId);
      if (planId && event.type === "customer.subscription.updated") {
        await applyPlan(planId, subscription.metadata?.academyId);
      }
    }
    return NextResponse.json({ received: true, type: event.type });
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
}
