import { isPreviewDeployment } from "@/lib/runtime";

export const PRODUCTION_APP_HOST = "tatamex.vercel.app";
export const PRODUCTION_APP_URL = `https://${PRODUCTION_APP_HOST}`;

/** Public origin of this deployment. Never include a trailing slash. */
export function publicAppUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) {
    const origin = normalizeOrigin(explicit);
    if (/jiupro/i.test(origin)) return PRODUCTION_APP_URL;
    return origin;
  }

  if (typeof window !== "undefined") {
    const origin = window.location.origin.replace(/\/$/, "");
    if (/jiupro/i.test(origin)) return PRODUCTION_APP_URL;
    return origin;
  }

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (vercel) {
    const origin = normalizeOrigin(vercel);
    if (/jiupro/i.test(origin)) return PRODUCTION_APP_URL;
    return origin;
  }

  return "http://127.0.0.1:43123";
}

function normalizeOrigin(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
}

export function isLocalOrigin(value: string) {
  return /127\.0\.0\.1|localhost/i.test(value);
}

export function appPathUrl(path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${publicAppUrl().replace(/\/$/, "")}${suffix}`;
}

export function stripeWebhookUrl() {
  return appPathUrl("/api/stripe/webhook");
}

export function asaasWebhookUrl() {
  return appPathUrl("/api/asaas/webhook");
}

export function passwordResetUrl() {
  return appPathUrl("/atualizar-senha");
}

/** Stripe return URLs: canonical host in production, this origin when developing locally. */
export function checkoutOrigin(request: Request) {
  const published = publicAppUrl();
  if (isLocalOrigin(published)) return new URL(request.url).origin;
  return published;
}

export function metadataBaseUrl() {
  try {
    return new URL(publicAppUrl());
  } catch {
    return new URL("http://127.0.0.1:43123");
  }
}

export function shouldIndexSite() {
  return !isPreviewDeployment();
}
