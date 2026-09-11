import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter, getClientIp } from '@/lib/rateLimit';

describe('RateLimiter (Anti-Brute Force Protection)', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ maxAttempts: 5, windowSeconds: 60 });
  });

  it('should allow attempts below the maximum threshold', () => {
    const key = 'test-ip-1';
    for (let i = 0; i < 4; i++) {
      const status = limiter.check(key);
      expect(status.allowed).toBe(true);
      expect(status.remaining).toBe(5 - i);
      limiter.recordFailure(key);
    }
  });

  it('should block and return retryAfter when maximum attempts are exceeded', () => {
    const key = 'test-ip-2';
    // 5 failed attempts
    for (let i = 0; i < 5; i++) {
      limiter.recordFailure(key);
    }

    const blocked = limiter.check(key);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('should reset failed attempts when authentication succeeds', () => {
    const key = 'test-ip-3';
    limiter.recordFailure(key);
    limiter.recordFailure(key);

    limiter.reset(key);

    const check = limiter.check(key);
    expect(check.allowed).toBe(true);
    expect(check.remaining).toBe(5);
  });

  it('should extract client IP from x-forwarded-for header correctly', () => {
    const req = new Request('http://localhost:3000', {
      headers: {
        'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
      },
    });

    const ip = getClientIp(req);
    expect(ip).toBe('203.0.113.195');
  });

  it('should fallback to x-real-ip or localhost if x-forwarded-for is missing', () => {
    const reqWithRealIp = new Request('http://localhost:3000', {
      headers: { 'x-real-ip': '198.51.100.4' },
    });
    expect(getClientIp(reqWithRealIp)).toBe('198.51.100.4');

    const emptyReq = new Request('http://localhost:3000');
    expect(getClientIp(emptyReq)).toBe('127.0.0.1');
  });
});
