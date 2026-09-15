import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { billingFromStripe } from "@/lib/billing-status";
import { getStripe } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";
import type { BillingStatus, PlanId } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function invoiceSubscriptionId(invoice: unknown) {
  const row = invoice as {
    subscription?: unknown;
    parent?: { subscription_details?: { subscription?: unknown } } | null;
  };
  if (typeof row.subscription === "string") return row.subscription;
  const nested = row.parent?.subscription_details?.subscription;
  if (typeof nested === "string") return nested;
  return null;
}

function asPlanId(value: string | undefined | null): PlanId | null {
  if (!value) return null;
  return PLANS.some((plan) => plan.id === value) ? (value as PlanId) : null;
}

async function findAcademyId(
  db: SupabaseClient,
  input: {
    academyId?: string | null;
    customerId?: string | null;
    subscriptionId?: string | null;
    email?: string | null;
  },
) {
  if (input.academyId) return input.academyId;
  if (input.subscriptionId) {
    const { data } = await db
      .from("academies")
      .select("id")
      .eq("stripe_subscription_id", input.subscriptionId)
      .maybeSingle();
    if (data?.id) return String(data.id);
  }
  if (input.customerId) {
    const { data } = await db
      .from("academies")
      .select("id")
      .eq("stripe_customer_id", input.customerId)
      .maybeSingle();
    if (data?.id) return String(data.id);
  }
  const email = input.email?.trim().toLowerCase();
  if (email) {
    const { data } = await db
      .from("profiles")
      .select("academy_id")
      .eq("email", email)
      .eq("role", "owner")
      .maybeSingle();
    if (data?.academy_id) return String(data.academy_id);
  }
  return null;
}

async function patchAcademy(
  db: SupabaseClient,
  academyId: string,
  patch: {
    plan?: PlanId;
    billingStatus?: BillingStatus;
    customerId?: string | null;
    subscriptionId?: string | null;
  },
) {
  const row: Record<string, unknown> = {};
  if (patch.plan) row.plan = patch.plan;
  if (patch.billingStatus) row.billing_status = patch.billingStatus;
  if (patch.customerId) row.stripe_customer_id = patch.customerId;
  if (patch.subscriptionId) row.stripe_subscription_id = patch.subscriptionId;
  if (Object.keys(row).length === 0) return;
  const first = await db.from("academies").update(row).eq("id", academyId);
  if (first.error && /billing_status/i.test(first.error.message)) {
    delete row.billing_status;
    if (Object.keys(row).length) await db.from("academies").update(row).eq("id", academyId);
  }
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

  const db = supabaseAdmin();

  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const planId = asPlanId(session.metadata?.planId);
      const academyId = db
        ? await findAcademyId(db, {
            academyId: session.metadata?.academyId,
            customerId: typeof session.customer === "string" ? session.customer : null,
            subscriptionId: typeof session.subscription === "string" ? session.subscription : null,
            email: session.customer_email || session.metadata?.email,
          })
        : session.metadata?.academyId;
      let status: BillingStatus = "active";
      if (typeof session.subscription === "string") {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        status = billingFromStripe(sub.status);
      }
      if (db && academyId) {
        await patchAcademy(db, academyId, {
          plan: planId ?? undefined,
          billingStatus: status,
          customerId: typeof session.customer === "string" ? session.customer : null,
          subscriptionId: typeof session.subscription === "string" ? session.subscription : null,
        });
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object;
      const planId = asPlanId(subscription.metadata?.planId);
      const status =
        event.type === "customer.subscription.deleted"
          ? ("canceled" as const)
          : billingFromStripe(subscription.status);
      const academyId = db
        ? await findAcademyId(db, {
            academyId: subscription.metadata?.academyId,
            customerId: typeof subscription.customer === "string" ? subscription.customer : null,
            subscriptionId: subscription.id,
          })
        : subscription.metadata?.academyId;
      if (db && academyId) {
        await patchAcademy(db, academyId, {
          plan: event.type === "customer.subscription.updated" ? planId ?? undefined : undefined,
          billingStatus: status,
          customerId: typeof subscription.customer === "string" ? subscription.customer : null,
          subscriptionId: subscription.id,
        });
      }
    }

    if (event.type === "invoice.payment_failed" || event.type === "invoice.paid") {
      const invoice = event.data.object;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
      const subscriptionId = invoiceSubscriptionId(invoice);
      const academyId = db
        ? await findAcademyId(db, { customerId, subscriptionId })
        : null;
      if (db && academyId) {
        await patchAcademy(db, academyId, {
          billingStatus: event.type === "invoice.paid" ? "active" : "past_due",
          customerId,
          subscriptionId,
        });
      }
    }

    return NextResponse.json({ received: true, type: event.type });
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
}
