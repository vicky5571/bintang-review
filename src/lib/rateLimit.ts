interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  maxAttempts: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number; // In seconds
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxAttempts: number;
  private windowMs: number;

  constructor(options: RateLimitOptions) {
    this.maxAttempts = options.maxAttempts;
    this.windowMs = options.windowSeconds * 1000;
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    // If no record or window expired, allow full quota
    if (!entry || now > entry.resetAt) {
      return {
        allowed: true,
        remaining: this.maxAttempts,
        retryAfter: 0,
      };
    }

    // If limit reached, block
    if (entry.count >= this.maxAttempts) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        retryAfter,
      };
    }

    return {
      allowed: true,
      remaining: this.maxAttempts - entry.count,
      retryAfter: 0,
    };
  }

  recordFailure(key: string): void {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return;
    }

    entry.count += 1;
    this.store.set(key, entry);
  }

  reset(key: string): void {
    this.store.delete(key);
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

// Global rate limit instances
// 1. Owner Portal PIN verification: 5 attempts per 15 minutes per IP:slug
export const portalPinLimiter = new RateLimiter({
  maxAttempts: 5,
  windowSeconds: 900,
});

// 2. Super Admin Login: 5 attempts per 15 minutes per IP
export const adminAuthLimiter = new RateLimiter({
  maxAttempts: 5,
  windowSeconds: 900,
});
