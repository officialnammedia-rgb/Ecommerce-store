// Simple in-memory token-bucket rate limiter for dev / single-instance deploys.
// For multi-instance production, swap with Upstash Ratelimit or Redis-based.

type Bucket = { tokens: number; updatedAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { capacity, refillPerSecond }: { capacity: number; refillPerSecond: number },
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b) {
    buckets.set(key, { tokens: capacity - 1, updatedAt: now });
    return { ok: true, retryAfterMs: 0 };
  }
  const elapsedSec = (now - b.updatedAt) / 1000;
  const refilled = Math.min(capacity, b.tokens + elapsedSec * refillPerSecond);
  if (refilled < 1) {
    const need = 1 - refilled;
    return { ok: false, retryAfterMs: Math.ceil((need / refillPerSecond) * 1000) };
  }
  b.tokens = refilled - 1;
  b.updatedAt = now;
  return { ok: true, retryAfterMs: 0 };
}

export function clientKey(req: Request, scope: string): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]?.trim() || "unknown";
  return `${scope}:${ip}`;
}
