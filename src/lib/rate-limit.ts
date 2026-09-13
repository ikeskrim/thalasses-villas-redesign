/**
 * A RATE-LIMIT STUB for the enquiry endpoint that does not exist yet.
 *
 * There is no server route today: the form validates in the browser and
 * delivers nothing (`EnquiryForm.tsx`). The day a mail provider is wired, the
 * route that sends must refuse a flood before it spends a provider call, and
 * this is the shape it plugs into — a fixed window per key.
 *
 * IN-MEMORY, AND SAID PLAINLY: on Vercel every serverless instance has its own
 * memory, so this bounds one instance, not the deployment. It is a floor, not
 * the control. The durable version is a shared store or Vercel's firewall rate
 * limiting — recorded as a deferral in `SECURITY-NOTES.md` §4.
 *
 * The key is whatever the route chooses (an IP, or better a hash of one).
 * Nothing here logs it, and nothing should: an IP address is personal data.
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key: string, now: number = Date.now()): RateLimitResult {
      let current = windows.get(key);
      if (!current || now >= current.resetAt) {
        current = { count: 0, resetAt: now + windowMs };
        windows.set(key, current);
      }
      current.count += 1;

      /* Bounded memory: a flood of distinct keys cannot grow the map forever. */
      if (windows.size > 10_000) {
        for (const [k, w] of windows) if (now >= w.resetAt) windows.delete(k);
      }

      return {
        allowed: current.count <= limit,
        remaining: Math.max(0, limit - current.count),
        resetAt: current.resetAt,
      };
    },
  };
}
