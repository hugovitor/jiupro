import Stripe from "stripe";
import { planById } from "@/lib/plans";
import type { PlanId } from "@/lib/types";

type CheckoutDiscount = Stripe.Checkout.SessionCreateParams.Discount;

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

async function findPromotionCode(stripe: Stripe, code: string) {
  const listed = await stripe.promotionCodes.list({ code, limit: 5 });
  return (
    listed.data.find((item) => item.code.toLowerCase() === code.toLowerCase()) ??
    listed.data[0] ??
    null
  );
}

async function findCoupon(stripe: Stripe, code: string) {
  const needle = code.toLowerCase();
  try {
    const byId = await stripe.coupons.retrieve(code);
    if (byId) return byId;
  } catch {
    /* not an id */
  }
  const listed = await stripe.coupons.list({ limit: 100 });
  return (
    listed.data.find(
      (coupon) =>
        coupon.id.toLowerCase() === needle || coupon.name?.toLowerCase() === needle,
    ) ?? null
  );
}

export async function resolveCheckoutDiscount(codeRaw?: string) {
  const stripe = getStripe();
  const code = codeRaw?.trim();
  if (!stripe || !code) return { discounts: undefined as CheckoutDiscount[] | undefined };

  const promo = await findPromotionCode(stripe, code);
  if (promo) {
    if (!promo.active) {
      return { error: "Este código promocional está desligado no Stripe." };
    }
    return { discounts: [{ promotion_code: promo.id }] };
  }

  const coupon = await findCoupon(stripe, code);
  if (coupon) {
    if (!coupon.valid) {
      return { error: "Este cupom expirou ou já atingiu o limite de usos." };
    }
    return { discounts: [{ coupon: coupon.id }] };
  }

  return {
    error:
      "Código não encontrado na conta Stripe de produção. No painel, modo Ao vivo: o checkout só aceita Código promocional, não o ID interno do cupom. Abra o cupom → Códigos promocionais → crie um código e use esse.",
  };
}

export function checkoutStripeError(err: unknown) {
  if (err instanceof Stripe.errors.StripeInvalidRequestError) {
    const msg = err.message || "";
    if (/appl(y|ies).to|not applicable to this|product/i.test(msg)) {
      return "Este cupom está limitado a outros produtos. No Stripe, deixe-o válido para todos os produtos JiuPro.";
    }
    if (/currency/i.test(msg)) {
      return "Este cupom está em outra moeda. Crie o desconto em BRL.";
    }
    return msg;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Não foi possível abrir o pagamento.";
}
