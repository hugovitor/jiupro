/** Public origin of this deployment. Never include a trailing slash. */
export function publicAppUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;

  const vercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  return "http://127.0.0.1:43123";
}

export function metadataBaseUrl() {
  try {
    return new URL(publicAppUrl());
  } catch {
    return new URL("http://127.0.0.1:43123");
  }
}
