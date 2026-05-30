/**
 * Synap Serverless & Edge Rate Limiter.
 * 
 * Works 100% locally with a global in-memory fixed-window fallback,
 * and automatically scales globally via Upstash Redis HTTP API if
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
 */

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

// Global in-memory cache to persist state across local hot-reloads
const globalCache = (global as any)._rateLimitCache || new Map<string, { count: number; resetAt: number }>();
if (!(global as any)._rateLimitCache) {
  (global as any)._rateLimitCache = globalCache;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cacheKey = `${key}:${Math.floor(now / windowMs)}`;
  const resetTime = (Math.floor(now / windowMs) + 1) * windowMs;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Production Scaling Flow: Upstash Redis HTTP API (Zero dependencies, Edge safe)
  if (redisUrl && redisToken) {
    try {
      const cleanUrl = redisUrl.endsWith('/') ? redisUrl : `${redisUrl}/`;
      const redisKey = `rate_limit:${cacheKey}`;
      
      // Execute multi-command transaction via HTTP Pipeline to verify limit in 1 RTT
      const res = await fetch(`${cleanUrl}pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', redisKey],
          ['EXPIRE', redisKey, windowSeconds],
        ]),
      });

      if (res.ok) {
        const results = await res.json();
        const count = results[0]?.result || 1;
        const remaining = Math.max(0, limit - count);

        return {
          success: count <= limit,
          limit,
          remaining,
          reset: resetTime,
        };
      }
    } catch (err: any) {
      console.warn('[Rate Limit Telemetry] Upstash Redis call failed, falling back to local memory:', err.message);
    }
  }

  // 2. Development/Fallback Flow: In-Memory Fixed-Window Limiter
  const record = globalCache.get(cacheKey) || { count: 0, resetAt: resetTime };
  
  // Clean up old window records to prevent memory leak
  for (const k of globalCache.keys()) {
    if (!k.endsWith(String(Math.floor(now / windowMs)))) {
      globalCache.delete(k);
    }
  }

  record.count += 1;
  globalCache.set(cacheKey, record);

  const remaining = Math.max(0, limit - record.count);

  return {
    success: record.count <= limit,
    limit,
    remaining,
    reset: record.resetAt,
  };
}

/**
 * Get client IP address securely.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}
