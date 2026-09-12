import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { dataStore } from '@/lib/store';
import { POST as authPost, GET as authGet } from '@/app/api/admin/auth/route';
import { POST as venuesPost, GET as venuesGet } from '@/app/api/admin/venues/route';
import { POST as agentsPost, GET as agentsGet } from '@/app/api/admin/sales-agents/route';

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

  it('should create a venue via /api/admin/venues POST route with sales_id sanitization', async () => {
    const req = new Request('http://localhost:3000/api/admin/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kafe Kenangan Indah',
        slug: 'kafe-kenangan-indah',
        google_review_url: 'https://maps.google.com/review',
        redirect_mode: 'smart_funnel',
        feedback_channels: 'whatsapp',
        whatsapp_number: '628123444555',
        owner_access_pin: '9999',
        is_active: true,
        sales_id: '', // Should be sanitized to null
        deal_amount: 599000,
        hpp: 125000,
        billing_type: 'one_time',
        monthly_retainer_fee: 0,
      }),
    });

    const res = await venuesPost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.venue.name).toBe('Kafe Kenangan Indah');
    expect(body.venue.sales_id).toBeNull();
    expect(body.venue.deal_amount).toBe(599000);
    expect(body.venue.hpp).toBe(125000);
    expect(body.venue.billing_type).toBe('one_time');
  });

  it('should support custom HPP and Harga Jual per transaction with correct margin', async () => {
    // Transaction A: Regular package
    const venueA = await dataStore.createVenue({
      name: 'Kafe Alpha',
      slug: 'kafe-alpha',
      google_review_url: 'https://maps.google.com/review',
      redirect_mode: 'smart_funnel',
      feedback_channels: 'whatsapp',
      owner_access_pin: '1111',
      is_active: true,
      deal_amount: 750000, // Harga Jual
      hpp: 180000, // HPP modal alat
      monthly_retainer_fee: 149000,
      deal_date: '2026-09-12',
    });

    // Transaction B: Discounted promo package with lower HPP
    const venueB = await dataStore.createVenue({
      name: 'Kafe Beta Promo',
      slug: 'kafe-beta-promo',
      google_review_url: 'https://maps.google.com/review',
      redirect_mode: 'direct_google',
      feedback_channels: 'email',
      owner_access_pin: '2222',
      is_active: true,
      deal_amount: 399000, // Harga Jual promo
      hpp: 95000, // HPP ekonomis
      monthly_retainer_fee: 0,
      deal_date: '2026-09-12',
    });

    expect(venueA.deal_amount).toBe(750000);
    expect(venueA.hpp).toBe(180000);
    const marginA = venueA.deal_amount - venueA.hpp;
    expect(marginA).toBe(570000);

    expect(venueB.deal_amount).toBe(399000);
    expect(venueB.hpp).toBe(95000);
    const marginB = venueB.deal_amount - venueB.hpp;
    expect(marginB).toBe(304000);
  });

  it('should list venues via /api/admin/venues GET route', async () => {
    const res = await venuesGet(new Request('http://localhost:3000/api/admin/venues'));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.venues)).toBe(true);
  });

  it('should create sales agent via /api/admin/sales-agents POST route', async () => {
    const req = new Request('http://localhost:3000/api/admin/sales-agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Siti Aminah',
        phone_whatsapp: '6281345678901',
        commission_type: 'fixed_amount',
        commission_rate: 150000,
      }),
    });

    const res = await agentsPost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.salesAgent.name).toBe('Siti Aminah');
    expect(body.salesAgent.commission_rate).toBe(150000);
  });

  it('should allow creating pre-fabricated stock QR stand with empty google_review_url and update when sold', async () => {
    // 1. Create stock stand without google_review_url
    const createReq = new Request('http://localhost:3000/api/admin/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Stok Stand Akrilik #101',
        slug: 'stand-akrilik-101',
        owner_access_pin: '1234',
        google_review_url: '', // Empty URL for pre-fabricated inventory stock
        deal_amount: 599000,
        hpp: 150000,
      }),
    });

    const createRes = await venuesPost(createReq);
    expect(createRes.status).toBe(200);

    const createBody = await createRes.json();
    expect(createBody.success).toBe(true);
    expect(createBody.venue.slug).toBe('stand-akrilik-101');
    expect(createBody.venue.google_review_url).toBe('');

    // 2. Later, when sold to a client, update with Google Review URL
    const updateReq = new Request('http://localhost:3000/api/admin/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: createBody.venue.id,
        name: 'Kafe Kenangan Manis (Eks Stand 101)',
        slug: 'stand-akrilik-101',
        owner_access_pin: '1234',
        google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJ1234567890',
        deal_amount: 599000,
        hpp: 150000,
      }),
    });

    const updateRes = await venuesPost(updateReq);
    expect(updateRes.status).toBe(200);

    const updateBody = await updateRes.json();
    expect(updateBody.success).toBe(true);
    expect(updateBody.venue.google_review_url).toBe('https://search.google.com/local/writereview?placeid=ChIJ1234567890');
    expect(updateBody.venue.name).toBe('Kafe Kenangan Manis (Eks Stand 101)');
  });

  it('should allow creating unactivated stock stand with deal_amount omitted or zero, and update with deal_amount upon QR activation', async () => {
    // 1. Create stock stand without google_review_url and without deal_amount (selling price not set yet)
    const createReq = new Request('http://localhost:3000/api/admin/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Stok Stand Batch #202',
        slug: 'stand-batch-202',
        owner_access_pin: '1234',
        google_review_url: '', // Unactivated QR
        deal_amount: 0, // Not required / not set yet
        hpp: 150000,
      }),
    });

    const createRes = await venuesPost(createReq);
    expect(createRes.status).toBe(200);

    const createBody = await createRes.json();
    expect(createBody.success).toBe(true);
    expect(createBody.venue.deal_amount).toBe(0);
    expect(createBody.venue.hpp).toBe(150000);
    expect(createBody.venue.is_active).toBe(false);

    // 2. Later, when QR is activated and sold to client, set review URL and deal_amount
    const activateReq = new Request('http://localhost:3000/api/admin/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: createBody.venue.id,
        name: 'Kafe Kenanga Indah',
        slug: 'stand-batch-202',
        owner_access_pin: '1234',
        google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJ987654321',
        deal_amount: 599000,
        hpp: 150000,
      }),
    });

    const activateRes = await venuesPost(activateReq);
    expect(activateRes.status).toBe(200);

    const activateBody = await activateRes.json();
    expect(activateBody.success).toBe(true);
    expect(activateBody.venue.deal_amount).toBe(599000);
    expect(activateBody.venue.is_active).toBe(true);
    expect(activateBody.venue.google_review_url).toBe('https://search.google.com/local/writereview?placeid=ChIJ987654321');
  });
});
