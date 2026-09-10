import { NextResponse } from "next/server";
import { signupTrialDays, type CheckoutOffer } from "@/lib/billing-offer";
import { planById, PLANS } from "@/lib/plans";
import {
  checkoutStripeError,
  findEmailGrant,
  getStripe,
  resolveCheckoutDiscount,
  stripePriceIdForPlan,
} from "@/lib/stripe";
import { checkoutOrigin } from "@/lib/app-url";
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
    promoCode?: string;
    offer?: CheckoutOffer;
  };
  const planId = isPlanId(body.planId) ? body.planId : "academia";
  const offer: CheckoutOffer = body.offer === "signup" ? "signup" : "change";
  const stripe = getStripe();
  const origin = checkoutOrigin(request);
  const plan = planById(planId);

  if (!stripe) {
    const next =
      offer === "signup"
        ? `${origin}/academia?guia=1&plan=${planId}&checkout=demo`
        : `${origin}/academia/configuracoes?checkout=demo&plan=${planId}`;
    return NextResponse.json({
      demo: true,
      url: next,
    });
  }

  const price = await stripePriceIdForPlan(planId);
  if (!price) {
    return NextResponse.json(
      { error: "Não foi possível criar o preço desta assinatura." },
      { status: 500 },
    );
  }

  const typedPromo = body.promoCode?.trim();
  const email = body.email?.trim().toLowerCase();

  let discount = typedPromo
    ? await resolveCheckoutDiscount(typedPromo)
    : { discounts: undefined as Awaited<ReturnType<typeof resolveCheckoutDiscount>>["discounts"] };
  if (typedPromo && "error" in discount && discount.error) {
    return NextResponse.json({ error: discount.error }, { status: 400 });
  }

  if (offer === "signup" && !discount.discounts) {
    const grant = await findEmailGrant(email);
    if (grant) {
      discount = { discounts: [{ promotion_code: grant.id }] };
    }
  }

  const trialDays =
    offer === "signup" && !discount.discounts ? signupTrialDays() : 0;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      locale: "pt-BR",
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/academia?assinatura=ok&plan=${planId}&guia=1`,
      cancel_url:
        offer === "signup"
          ? `${origin}/academia/configuracoes?assinatura=cancelada`
          : `${origin}/planos?assinatura=cancelada`,
      ...(discount.discounts
        ? { discounts: discount.discounts }
        : {
            allow_promotion_codes: true,
            custom_text: {
              submit: {
                message:
                  "Cupom: toque em Adicionar código promocional. Use o código que você criou, não o ID do cupom.",
              },
            },
          }),
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      phone_number_collection: { enabled: true },
      payment_method_collection: trialDays > 0 || !discount.discounts ? "always" : "if_required",
      customer_email: email || undefined,
      metadata: {
        planId,
        email: email ?? "",
        academyName: body.academyName?.trim() ?? "",
        academyId: body.academyId?.trim() ?? "",
        offer,
      },
      subscription_data: {
        description: `TatameX ${plan.name}`,
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
        metadata: {
          planId,
          academyId: body.academyId?.trim() ?? "",
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: checkoutStripeError(err) }, { status: 400 });
  }
}
