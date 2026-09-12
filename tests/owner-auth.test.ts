import { describe, it, expect, beforeEach } from 'vitest';
import { dataStore } from '@/lib/store';
import { POST as authLoginPost } from '@/app/api/auth/login/route';
import { GET as authMeGet, POST as authMePost } from '@/app/api/auth/me/route';
import { GET as portalVerifyGet, POST as portalVerifyPost } from '@/app/api/portal/verify/route';
import { GET as adminVenuesGet, POST as adminVenuesPost } from '@/app/api/admin/venues/route';
import { GET as adminSpecialistsGet, POST as adminSpecialistsPost } from '@/app/api/admin/marketing-specialists/route';

describe('Cafe Owner Authentication & Smart Portal Access', () => {
  beforeEach(async () => {
    dataStore.reset();
  });

  it('should authenticate owner using venue slug and valid PIN, and set auth_session cookie', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'owner',
        identifier: 'kopi-senja',
        pin: '1234',
      }),
    });

    const res = await authLoginPost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.role).toBe('owner');
    expect(body.user.venue_slug).toBe('kopi-senja');
    expect(body.redirectUrl).toBe('/portal/kopi-senja');

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('auth_session=');
  });

  it('should authenticate owner using Indonesian WhatsApp phone number format (08... or 628...)', async () => {
    // The seeded venue 'kopi-senja' has whatsapp_number: '628123456789'
    // Testing with local 08123456789 format
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'owner',
        identifier: '08123456789',
        pin: '1234',
      }),
    });

    const res = await authLoginPost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.venue_slug).toBe('kopi-senja');
  });

  it('should reject invalid PIN or non-existent identifier with HTTP 401', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'owner',
        identifier: 'kopi-senja',
        pin: '9999',
      }),
    });

    const res = await authLoginPost(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toMatch(/tidak ditemukan atau PIN salah/i);
  });

  it('should enable smart bypass on GET /api/portal/verify when valid owner session cookie is present', async () => {
    // 1. First, request without session cookie -> returns public info only (authenticated: false)
    const unauthReq = new Request('http://localhost:3000/api/portal/verify?slug=kopi-senja');
    const unauthRes = await portalVerifyGet(unauthReq);
    expect(unauthRes.status).toBe(200);
    const unauthBody = await unauthRes.json();
    expect(unauthBody.authenticated).toBe(false);
    expect(unauthBody.analytics).toBeUndefined();

    // 2. Login as owner to obtain cookie
    const loginReq = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'owner',
        identifier: 'kopi-senja',
        pin: '1234',
      }),
    });
    const loginRes = await authLoginPost(loginReq);
    const setCookie = loginRes.headers.get('set-cookie');
    const cookieMatch = setCookie?.match(/auth_session=[^;]+/);
    expect(cookieMatch).toBeTruthy();
    const cookieHeader = cookieMatch![0];

    // 3. Now request /api/portal/verify with the session cookie -> Smart Bypass!
    const authReq = new Request('http://localhost:3000/api/portal/verify?slug=kopi-senja', {
      headers: {
        cookie: cookieHeader,
      },
    });
    const authRes = await portalVerifyGet(authReq);
    expect(authRes.status).toBe(200);
    const authBody = await authRes.json();
    expect(authBody.authenticated).toBe(true);
    expect(authBody.venue).toBeDefined();
    expect(authBody.venue.slug).toBe('kopi-senja');
    expect(authBody.analytics).toBeDefined();
    expect(authBody.feedbacks).toBeDefined();
  });

  it('should set session cookie when PIN is entered in POST /api/portal/verify', async () => {
    const req = new Request('http://localhost:3000/api/portal/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'kopi-senja',
        pin: '1234',
      }),
    });

    const res = await portalVerifyPost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('auth_session=');
  });

  it('should clear session upon logout POST /api/auth/me', async () => {
    const res = await authMePost(new Request('http://localhost:3000/api/auth/me', { method: 'POST' }));
    expect(res.status).toBe(200);

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('should strictly deny cafe owner from accessing admin APIs (venues and specialists)', async () => {
    // 1. Authenticate as cafe owner
    const loginReq = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'owner',
        identifier: 'kopi-senja',
        pin: '1234',
      }),
    });
    const loginRes = await authLoginPost(loginReq);
    const setCookie = loginRes.headers.get('set-cookie')!;
    const cookieHeader = setCookie.match(/auth_session=[^;]+/)![0];

    // 2. Attempt to GET /api/admin/venues with owner cookie -> 403 Forbidden
    const getVenuesReq = new Request('http://localhost:3000/api/admin/venues', {
      headers: { cookie: cookieHeader },
    });
    const getVenuesRes = await adminVenuesGet(getVenuesReq);
    expect(getVenuesRes.status).toBe(403);
    const getVenuesBody = await getVenuesRes.json();
    expect(getVenuesBody.error).toContain('Akses ditolak');

    // 3. Attempt to POST /api/admin/venues with owner cookie -> 403 Forbidden
    const postVenuesReq = new Request('http://localhost:3000/api/admin/venues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify({ name: 'Hacked Venue' }),
    });
    const postVenuesRes = await adminVenuesPost(postVenuesReq);
    expect(postVenuesRes.status).toBe(403);

    // 4. Attempt to GET /api/admin/marketing-specialists with owner cookie -> 403 Forbidden
    const getSpecReq = new Request('http://localhost:3000/api/admin/marketing-specialists', {
      headers: { cookie: cookieHeader },
    });
    const getSpecRes = await adminSpecialistsGet(getSpecReq);
    expect(getSpecRes.status).toBe(403);
  });
});


