import Stripe from "stripe";

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
