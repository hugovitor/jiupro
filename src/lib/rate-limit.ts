const buckets = new Map<string, { count: number; resetAt: number }>();

export type RateLimitRule = {
  limit: number;
  windowMs: number;
};

export const RATE_LIMITS = {
  signup: { limit: 5, windowMs: 60 * 60 * 1000 },
  login: { limit: 12, windowMs: 15 * 60 * 1000 },
  search: { limit: 30, windowMs: 10 * 60 * 1000 },
  reset: { limit: 5, windowMs: 60 * 60 * 1000 },
  join: { limit: 10, windowMs: 15 * 60 * 1000 },
} as const satisfies Record<string, RateLimitRule>;

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  if (first) return first;
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "local"
  );
}

export function consumeRateLimit(key: string, rule: RateLimitRule) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true as const, remaining: rule.limit - 1, retryAfterSec: 0 };
  }
  if (current.count >= rule.limit) {
    return {
      ok: false as const,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  current.count += 1;
  return { ok: true as const, remaining: rule.limit - current.count, retryAfterSec: 0 };
}

export function rateLimitExceededResponse(retryAfterSec: number) {
  return Response.json(
    { error: "Muitas tentativas. Espere um pouco e tente de novo." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    },
  );
}
