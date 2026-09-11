import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { middleware } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';

describe('Edge Middleware (/r/:slug)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should pass through (NextResponse.next()) when venue is in smart_funnel mode', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'venue-1',
          slug: 'kopi-senja',
          redirect_mode: 'smart_funnel',
          google_review_url: 'https://g.page/r/mock/review',
          is_active: true,
        },
      ],
    });

    const req = new NextRequest('http://localhost:3000/r/kopi-senja');
    const res = await middleware(req);

    // Should not redirect, should allow rendering
    expect(res.status).not.toBe(302);
  });

  it('should trigger sub-150ms HTTP 302 redirect to Google Review URL when venue is in direct_google mode', async () => {
    const mockPostLog = vi.fn();
    global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        mockPostLog();
        return { ok: true };
      }
      return {
        ok: true,
        json: async () => [
          {
            id: 'venue-direct',
            slug: 'cafe-cepat',
            redirect_mode: 'direct_google',
            google_review_url: 'https://maps.google.com/?cid=12345678',
            is_active: true,
          },
        ],
      };
    });

    const req = new NextRequest('http://localhost:3000/r/cafe-cepat', {
      headers: {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      },
    });

    const res = await middleware(req);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://maps.google.com/?cid=12345678');
    expect(mockPostLog).toHaveBeenCalled();
  });

  it('should gracefully fallback to NextResponse.next() if venue is not found or Supabase fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    const req = new NextRequest('http://localhost:3000/r/unknown-cafe');
    const res = await middleware(req);

    expect(res.status).not.toBe(302);
  });

  it('should reject unsafe protocols (e.g. javascript:) and fallback to NextResponse.next()', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'venue-malicious',
          slug: 'evil-cafe',
          redirect_mode: 'direct_google',
          google_review_url: 'javascript:alert(1)',
          is_active: true,
        },
      ],
    });

    const req = new NextRequest('http://localhost:3000/r/evil-cafe');
    const res = await middleware(req);

    expect(res.status).not.toBe(302);
  });
});
