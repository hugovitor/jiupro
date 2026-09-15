import { publicAppUrl } from "@/lib/app-url";

export function requestOriginAllowed(request: Request) {
  const originHeader = request.headers.get("origin") ?? "";
  const referer = request.headers.get("referer") ?? "";
  const candidate = originHeader || referer;
  if (!candidate) return true;
  try {
    const got = new URL(candidate).origin;
    const allowed = new Set([new URL(request.url).origin, new URL(publicAppUrl()).origin]);
    return allowed.has(got);
  } catch {
    return false;
  }
}
