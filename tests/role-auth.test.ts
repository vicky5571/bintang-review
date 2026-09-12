import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { dataStore } from '@/lib/store';
import { POST as loginPost } from '@/app/api/auth/login/route';
import { GET as meGet, POST as mePost } from '@/app/api/auth/me/route';
import { GET as venuesGet, POST as venuesPost } from '@/app/api/admin/venues/route';
import { GET as specialistsGet, POST as specialistsPost } from '@/app/api/admin/marketing-specialists/route';

describe('Role-Based Authentication & Marketing Specialist Isolation', () => {
  const originalAdminPass = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    dataStore.reset();
    process.env.ADMIN_PASSWORD = 'supersecretpass';
  });

  afterEach(() => {
    process.env.ADMIN_PASSWORD = originalAdminPass;
  });

  it('authenticates Super Admin and issues session cookie', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'super_admin',
        password: 'supersecretpass',
      }),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.role).toBe('super_admin');
    expect(body.user.name).toBe('Super Admin');

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('auth_session=');
  });

  it('rejects invalid Super Admin password', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'super_admin',
        password: 'wrongpassword',
      }),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toContain('Kata sandi Super Admin salah');
  });

  it('authenticates Marketing Specialist with WhatsApp number and PIN', async () => {
    // Initial specialist Budi Santoso exists in InMemoryStore with phone 628123456789 and PIN 1234
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'marketing_specialist',
        identifier: '628123456789',
        pin: '1234',
      }),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.role).toBe('marketing_specialist');
    expect(body.user.name).toContain('Budi Santoso');
    expect(body.user.specialist_id).toBeDefined();

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('auth_session=');
  });

  it('authenticates Marketing Specialist with Email and PIN', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'marketing_specialist',
        identifier: 'budi@bintangreview.id',
        pin: '1234',
      }),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.name).toContain('Budi Santoso');
  });

  it('rejects Marketing Specialist with wrong PIN', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'marketing_specialist',
        identifier: '628123456789',
        pin: '9999',
      }),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toContain('tidak ditemukan atau PIN salah');
  });

  it('creates and lists Marketing Specialists with custom access PIN', async () => {
    // Create new specialist
    const postReq = new Request('http://localhost:3000/api/admin/marketing-specialists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Citra Dewi',
        phone_whatsapp: '6281987654321',
        email: 'citra@example.com',
        access_pin: '8888',
        commission_type: 'fixed_amount',
        commission_rate: 200000,
      }),
    });

    const postRes = await specialistsPost(postReq);
    expect(postRes.status).toBe(200);
    const postBody = await postRes.json();
    expect(postBody.marketingSpecialist.name).toBe('Citra Dewi');
    expect(postBody.marketingSpecialist.access_pin).toBe('8888');

    // List specialists
    const getRes = await specialistsGet(new Request('http://localhost:3000/api/admin/marketing-specialists'));
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.marketingSpecialists.length).toBeGreaterThanOrEqual(2);

    // Verify newly created specialist can log in with their PIN
    const loginReq = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'marketing_specialist',
        identifier: '6281987654321',
        pin: '8888',
      }),
    });
    const loginRes = await loginPost(loginReq);
    expect(loginRes.status).toBe(200);
    const loginBody = await loginRes.json();
    expect(loginBody.user.name).toBe('Citra Dewi');
  });

  it('scopes venues for Marketing Specialist session and auto-assigns attribution on create', async () => {
    const specialistId = '00000000-0000-0000-0000-000000000001'; // Budi Santoso
    const sessionToken = Buffer.from(
      JSON.stringify({
        authenticated: true,
        role: 'marketing_specialist',
        specialist_id: specialistId,
        name: 'Budi Santoso',
      })
    ).toString('base64');

    // 1. Marketing Specialist GET /api/admin/venues should only see their assigned venues
    const getReq = new Request('http://localhost:3000/api/admin/venues', {
      headers: {
        cookie: `auth_session=${sessionToken}`,
      },
    });
    const getRes = await venuesGet(getReq);
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();

    // Default mock data: kopi-senja has sales_id = specialistId, but artisan-bakery has null
    expect(getBody.venues.length).toBe(1);
    expect(getBody.venues[0].slug).toBe('kopi-senja');

    // 2. Marketing Specialist POST /api/admin/venues auto-assigns marketing_id to their specialist_id
    const postReq = new Request('http://localhost:3000/api/admin/venues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `auth_session=${sessionToken}`,
      },
      body: JSON.stringify({
        name: 'Kopi Baru Budi',
        slug: 'kopi-baru-budi',
        google_review_url: 'https://maps.google.com/review',
        redirect_mode: 'smart_funnel',
        feedback_channels: 'whatsapp',
        whatsapp_number: '628111222333',
        owner_access_pin: '4321',
        deal_amount: 599000,
        billing_type: 'subscription',
        monthly_retainer_fee: 149000,
        marketing_id: 'some-other-id-attempt', // Should be overridden by session
      }),
    });

    const postRes = await venuesPost(postReq);
    expect(postRes.status).toBe(200);
    const postBody = await postRes.json();
    expect(postBody.venue.sales_id).toBe(specialistId);
    expect(postBody.venue.marketing_id).toBe(specialistId);

    // 3. Re-query venues as Budi: now has 2 venues
    const getReq2 = new Request('http://localhost:3000/api/admin/venues', {
      headers: {
        cookie: `auth_session=${sessionToken}`,
      },
    });
    const getRes2 = await venuesGet(getReq2);
    const getBody2 = await getRes2.json();
    expect(getBody2.venues.length).toBe(2);
  });

  it('inspects session via GET /api/auth/me and logs out via POST /api/auth/me', async () => {
    // Unauthenticated
    const unauthReq = new Request('http://localhost:3000/api/auth/me');
    const unauthRes = await meGet(unauthReq);
    expect((await unauthRes.json()).authenticated).toBe(false);

    // Authenticated
    const sessionToken = Buffer.from(
      JSON.stringify({
        authenticated: true,
        role: 'super_admin',
        name: 'Super Admin',
      })
    ).toString('base64');

    const authReq = new Request('http://localhost:3000/api/auth/me', {
      headers: {
        cookie: `auth_session=${sessionToken}`,
      },
    });
    const authRes = await meGet(authReq);
    const authBody = await authRes.json();
    expect(authBody.authenticated).toBe(true);
    expect(authBody.user.role).toBe('super_admin');

    // Logout
    const logoutReq = new Request('http://localhost:3000/api/auth/me', {
      method: 'POST',
    });
    const logoutRes = await mePost(logoutReq);
    expect(logoutRes.status).toBe(200);
    const logoutCookies = logoutRes.headers.get('set-cookie');
    expect(logoutCookies).toContain('Max-Age=0');
  });
});
