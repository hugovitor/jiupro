import Stripe from "stripe";
import { planById } from "@/lib/plans";
import type { PlanId } from "@/lib/types";

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, {
    apiVersion: "2026-08-26.dahlia",
  });
}

export const STRIPE_PRICE_ENV: Record<string, string | undefined> = {
  essencial: process.env.STRIPE_PRICE_ESSENCIAL?.trim(),
  academia: process.env.STRIPE_PRICE_ACADEMIA?.trim(),
  equipe: process.env.STRIPE_PRICE_EQUIPE?.trim(),
};

export async function stripePriceIdForPlan(planId: PlanId) {
  const fromEnv = STRIPE_PRICE_ENV[planId];
  if (fromEnv) return fromEnv;
  const stripe = getStripe();
  if (!stripe) return null;
  const plan = planById(planId);
  const lookup = `jiupro_${plan.id}_monthly`;
  const existing = await stripe.prices.list({
    lookup_keys: [lookup],
    active: true,
    limit: 1,
  });
  if (existing.data[0]?.id) return existing.data[0].id;
  const product = await stripe.products.create({
    name: `JiuPro ${plan.name}`,
    description: `${plan.blurb} Assinatura mensal da academia.`,
    metadata: { planId: plan.id },
  });
  const price = await stripe.prices.create({
    product: product.id,
    currency: "brl",
    unit_amount: plan.price * 100,
    recurring: { interval: "month" },
    lookup_key: lookup,
    nickname: `${plan.name} mensal`,
    metadata: { planId: plan.id },
  });
  return price.id;
}
