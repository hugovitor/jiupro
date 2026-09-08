import { NextResponse } from "next/server";
import { planById, PLANS } from "@/lib/plans";
import { getStripe, stripePriceIdForPlan } from "@/lib/stripe";
import type { PlanId } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPlanId(value: string | undefined): value is PlanId {
  return PLANS.some((plan) => plan.id === value);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    planId?: string;
    email?: string;
    academyName?: string;
    academyId?: string;
  };
  const planId = isPlanId(body.planId) ? body.planId : "academia";
  const stripe = getStripe();
  const origin = new URL(request.url).origin;
  const plan = planById(planId);

  if (!stripe) {
    return NextResponse.json({
      demo: true,
      url: `${origin}/academia/configuracoes?checkout=demo&plan=${planId}`,
    });
  }

  const price = await stripePriceIdForPlan(planId);
  if (!price) {
    return NextResponse.json(
      { error: "Não foi possível criar o preço desta assinatura." },
      { status: 500 },
    );
  }

  const email = body.email?.trim().toLowerCase();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    locale: "pt-BR",
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/academia?assinatura=ok&plan=${planId}`,
    cancel_url: `${origin}/planos?assinatura=cancelada`,
    allow_promotion_codes: true,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    phone_number_collection: { enabled: true },
    customer_email: email || undefined,
    metadata: {
      planId,
      email: email ?? "",
      academyName: body.academyName?.trim() ?? "",
      academyId: body.academyId?.trim() ?? "",
    },
    subscription_data: {
      description: `JiuPro ${plan.name}`,
      metadata: {
        planId,
        academyId: body.academyId?.trim() ?? "",
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
