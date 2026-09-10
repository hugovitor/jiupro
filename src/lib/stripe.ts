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
  for (const lookup of [`tatamex_${plan.id}_monthly`, `jiupro_${plan.id}_monthly`]) {
    const existing = await stripe.prices.list({
      lookup_keys: [lookup],
      active: true,
      limit: 1,
    });
    if (existing.data[0]?.id) return existing.data[0].id;
  }
  const lookup = `tatamex_${plan.id}_monthly`;
  const product = await stripe.products.create({
    name: `TatameX ${plan.name}`,
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
  const trimmed = code.trim();
  const variants = [...new Set([trimmed, trimmed.toUpperCase(), trimmed.toLowerCase()])];
  for (const variant of variants) {
    const listed = await stripe.promotionCodes.list({
      code: variant,
      active: true,
      limit: 5,
    });
    const hit = listed.data.find(
      (item) => item.code.toLowerCase() === trimmed.toLowerCase(),
    );
    if (hit) return hit;
  }
  return null;
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

export async function findEmailGrant(emailRaw?: string) {
  const stripe = getStripe();
  const email = emailRaw?.trim().toLowerCase();
  if (!stripe || !email) return null;

  let startingAfter: string | undefined;
  for (let i = 0; i < 8; i++) {
    const page = await stripe.promotionCodes.list({
      active: true,
      limit: 100,
      starting_after: startingAfter,
    });
    const hit = page.data.find(
      (item) => item.metadata?.email?.trim().toLowerCase() === email,
    );
    if (hit) return hit;
    if (!page.has_more) break;
    startingAfter = page.data.at(-1)?.id;
  }
  return null;
}

export function randomPromoCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `JP-${suffix}`;
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
      "Este código não existe no Stripe (modo Ao vivo). Use o Código promocional que o cliente digita — em Produtos → Cupons → o cupom → Códigos promocionais. O ID interno (tipo n4t…) o Checkout não aceita.",
  };
}

export function checkoutStripeError(err: unknown) {
  if (err instanceof Stripe.errors.StripeInvalidRequestError) {
    const msg = err.message || "";
    if (/appl(y|ies).to|not applicable to this|product/i.test(msg)) {
      return "Este cupom está limitado a outros produtos. No Stripe, deixe-o válido para todos os produtos TatameX.";
    }
    if (/currency/i.test(msg)) {
      return "Este cupom está em outra moeda. Crie o desconto em BRL.";
    }
    return msg;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Não foi possível abrir o pagamento.";
}
