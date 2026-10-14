// Limitador simples em memória. Em serverless cada instância tem o seu contador,
// então é uma proteção "melhor esforço" contra tentativas em sequência.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): { ok: boolean; retryAfterSec: number } {
  if (buckets.size > 2000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (b.count >= limit) return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  b.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

export function clearRateLimits() {
  buckets.clear();
}
