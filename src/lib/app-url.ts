import { isPreviewDeployment } from "@/lib/runtime";

/** Public origin of this deployment. Never include a trailing slash. */
export function publicAppUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return normalizeOrigin(explicit);

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (vercel) return normalizeOrigin(vercel);

  return "http://127.0.0.1:43123";
}

function normalizeOrigin(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://${value}`;
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
