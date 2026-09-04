import { NextResponse } from "next/server";
import { getStripe, STRIPE_PRICE_ENV } from "@/lib/stripe";
import type { PlanId } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { planId?: PlanId };
  const planId = body.planId ?? "academia";
  const stripe = getStripe();
  const origin = new URL(request.url).origin;

  if (!stripe) {
    return NextResponse.json({
      demo: true,
      url: `${origin}/academia/configuracoes?checkout=demo&plan=${planId}`,
    });
  }

  const price = STRIPE_PRICE_ENV[planId];
  if (!price) {
    return NextResponse.json(
      { error: "Preço Stripe não configurado para este plano." },
      { status: 400 },
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/academia/configuracoes?checkout=success&plan=${planId}`,
    cancel_url: `${origin}/planos?checkout=cancel`,
    allow_promotion_codes: true,
    billing_address_collection: "required",
  });

  return NextResponse.json({ url: session.url });
}
