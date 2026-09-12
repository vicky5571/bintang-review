import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { dataStore } from '@/lib/store';
import { POST as authPost, GET as authGet } from '@/app/api/admin/auth/route';

describe('Admin Management & Auth Operations', () => {
  const originalAdminPass = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    dataStore.reset();
    process.env.ADMIN_PASSWORD = 'supersecretpass';
  });

  afterEach(() => {
    process.env.ADMIN_PASSWORD = originalAdminPass;
  });

  it('should create a new client venue with custom slug and settings', async () => {
    const venue = await dataStore.createVenue({
      slug: 'warung-kopi-sedap',
      name: 'Warung Kopi Sedap',
      google_review_url: 'https://maps.google.com/review',
      redirect_mode: 'direct_google',
      feedback_channels: 'whatsapp',
      whatsapp_number: '628987654321',
      owner_access_pin: '5678',
      is_active: true,
      deal_amount: 499000,
      monthly_retainer_fee: 49000,
      deal_date: '2026-09-12',
    });

    expect(venue.id).toBeDefined();
    expect(venue.slug).toBe('warung-kopi-sedap');
    expect(venue.redirect_mode).toBe('direct_google');
  });

  it('should toggle venue status between active and inactive', async () => {
    const venue = await dataStore.getVenueBySlug('kopi-senja');
    expect(venue).not.toBeNull();

    const updated = await dataStore.updateVenue(venue!.id, { is_active: false });
    expect(updated?.is_active).toBe(false);
  });

  it('should reject incorrect admin password with HTTP 401', async () => {
    const req = new Request('http://localhost:3000/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrongpassword' }),
    });

    const res = await authPost(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toMatch(/Password salah/i);
  });

  it('should authenticate correct admin password and set secure session cookie', async () => {
    const req = new Request('http://localhost:3000/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'supersecretpass' }),
    });

    const res = await authPost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('admin_session=');
  });

  it('should verify session via GET /api/admin/auth', async () => {
    // Unauthenticated
    const unauthReq = new Request('http://localhost:3000/api/admin/auth');
    const unauthRes = await authGet(unauthReq);
    const unauthBody = await unauthRes.json();
    expect(unauthBody.authenticated).toBe(false);

    // Authenticated with cookie
    const authReq = new Request('http://localhost:3000/api/admin/auth', {
      headers: {
        cookie: 'admin_session=valid_admin_token',
      },
    });
    const authRes = await authGet(authReq);
    const authBody = await authRes.json();
    expect(authBody.authenticated).toBe(true);
  });

  it('should block excessive invalid admin login attempts with HTTP 429', async () => {
    const ip = '198.51.100.77';
    for (let i = 0; i < 5; i++) {
      await authPost(
        new Request('http://localhost:3000/api/admin/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': ip,
          },
          body: JSON.stringify({ password: 'wrong' }),
        })
      );
    }

    const blockedRes = await authPost(
      new Request('http://localhost:3000/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify({ password: 'supersecretpass' }),
      })
    );

    expect(blockedRes.status).toBe(429);
    const body = await blockedRes.json();
    expect(body.error).toMatch(/Terlalu banyak percobaan gagal/i);
    expect(blockedRes.headers.get('Retry-After')).toBeDefined();
  });

  it('should create a new marketing specialist sales agent and list in commission overview', async () => {
    const agent = await dataStore.createSalesAgent({
      name: 'Rian Pratama',
      phone_whatsapp: '6281299988877',
      email: 'rian@example.com',
      commission_type: 'percentage',
      commission_rate: 25,
      is_active: true,
    });

    expect(agent.id).toBeDefined();
    expect(agent.name).toBe('Rian Pratama');
    expect(agent.commission_rate).toBe(25);

    const list = await dataStore.listSalesAgents();
    const found = list.find((a) => a.id === agent.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Rian Pratama');
    expect(found?.commission_rate).toBe(25);
  });
});
