export type CheckoutOffer = "signup" | "change";

const DEFAULT_SIGNUP_TRIAL_DAYS = 30;

export function signupTrialDays() {
  const raw = process.env.NEXT_PUBLIC_STRIPE_TRIAL_DAYS?.trim();
  if (raw === "0" || raw === "false") return 0;
  if (!raw) return DEFAULT_SIGNUP_TRIAL_DAYS;
  const days = Number(raw);
  if (!Number.isFinite(days) || days <= 0) return 0;
  return Math.min(Math.floor(days), 90);
}

export function signupTrialLabel(days = signupTrialDays()) {
  if (days <= 0) return null;
  if (days === 30) return "Primeiro mês grátis";
  if (days === 1) return "1 dia grátis";
  return `${days} dias grátis`;
}

export function signupPromoFromEnv() {
  return process.env.STRIPE_SIGNUP_PROMO?.trim() || "";
}
