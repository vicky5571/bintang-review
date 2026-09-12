import { describe, it, expect, beforeEach } from 'vitest';
import { calculateVenueSettlement } from '@/lib/profitSharing';
import { dataStore } from '@/lib/store';
import { PATCH as settlementPatch } from '@/app/api/admin/venues/settlement/route';

describe('Option B Settlement & Multi-Bearer HPP Tracking', () => {
  beforeEach(() => {
    dataStore.reset();
  });

  describe('Pure calculateVenueSettlement unit tests', () => {
    it('Scenario 1: 100% Marketing HPP - Unpaid then Paid', () => {
      // Deal 70.000, HPP 30.000, Marketing 100%
      const initial = calculateVenueSettlement({
        deal_amount: 70000,
        hpp: 30000,
        hpp_payer: 'marketing',
        hpp_marketing_ratio: 100,
        transport_fee: 20000,
        hpp_reimburse_status: 'unpaid',
        profit_share_status: 'unpaid',
      });

      expect(initial.reimburse_marketing).toBe(30000);
      expect(initial.profit_share_marketing).toBe(36000); // 20.000 transport + 16.000 final share
      expect(initial.unpaid_reimburse_marketing).toBe(30000);
      expect(initial.unpaid_profit_share_marketing).toBe(36000);
      expect(initial.total_unpaid_marketing).toBe(66000);
      expect(initial.total_paid_marketing).toBe(0);

      // Super Admin reimburses HPP only
      const afterHppReimbursed = calculateVenueSettlement({
        deal_amount: 70000,
        hpp: 30000,
        hpp_payer: 'marketing',
        hpp_marketing_ratio: 100,
        transport_fee: 20000,
        hpp_reimburse_status: 'paid',
        profit_share_status: 'unpaid',
      });

      expect(afterHppReimbursed.unpaid_reimburse_marketing).toBe(0);
      expect(afterHppReimbursed.paid_reimburse_marketing).toBe(30000);
      expect(afterHppReimbursed.unpaid_profit_share_marketing).toBe(36000);
      expect(afterHppReimbursed.total_unpaid_marketing).toBe(36000);
      expect(afterHppReimbursed.total_paid_marketing).toBe(30000);

      // Super Admin also pays profit share
      const fullySettled = calculateVenueSettlement({
        deal_amount: 70000,
        hpp: 30000,
        hpp_payer: 'marketing',
        hpp_marketing_ratio: 100,
        transport_fee: 20000,
        hpp_reimburse_status: 'paid',
        profit_share_status: 'paid',
      });

      expect(fullySettled.total_unpaid_marketing).toBe(0);
      expect(fullySettled.total_paid_marketing).toBe(66000);
    });

    it('Scenario 2: 100% Platform HPP - Reimburse is Not Applicable', () => {
      const res = calculateVenueSettlement({
        deal_amount: 70000,
        hpp: 30000,
        hpp_payer: 'platform',
        hpp_marketing_ratio: 0,
        transport_fee: 20000,
        hpp_reimburse_status: 'not_applicable',
        profit_share_status: 'unpaid',
      });

      expect(res.reimburse_marketing).toBe(0);
      expect(res.reimburse_status).toBe('not_applicable');
      expect(res.unpaid_reimburse_marketing).toBe(0);
      expect(res.paid_reimburse_marketing).toBe(0);

      // Marketing only receives profit share (20.000 transport, 0 share)
      expect(res.profit_share_marketing).toBe(20000);
      expect(res.unpaid_profit_share_marketing).toBe(20000);
      expect(res.total_unpaid_marketing).toBe(20000);
    });

    it('Scenario 3: Penanggung HPP Lebih Dari 1 Orang (Split 50:50 Bersama)', () => {
      // Deal 70.000, HPP 30.000 split 50:50 between Marketing (50%) and Platform (50%)
      const res = calculateVenueSettlement({
        deal_amount: 70000,
        hpp: 30000,
        hpp_payer: 'split',
        hpp_marketing_ratio: 50,
        transport_fee: 20000,
        hpp_reimburse_status: 'unpaid',
        profit_share_status: 'unpaid',
      });

      // Marketing's portion of HPP is exactly 50% = 15.000
      expect(res.reimburse_marketing).toBe(15000);
      // Marketing's profit share = 20.000 transport + 50% of 16.000 = 28.000
      expect(res.profit_share_marketing).toBe(28000);
      expect(res.unpaid_reimburse_marketing).toBe(15000);
      expect(res.unpaid_profit_share_marketing).toBe(28000);
      expect(res.total_unpaid_marketing).toBe(43000);

      // Verify that when only HPP is paid to Marketing:
      const hppPaidRes = calculateVenueSettlement({
        deal_amount: 70000,
        hpp: 30000,
        hpp_payer: 'split',
        hpp_marketing_ratio: 50,
        transport_fee: 20000,
        hpp_reimburse_status: 'paid',
        profit_share_status: 'unpaid',
      });

      expect(hppPaidRes.unpaid_reimburse_marketing).toBe(0);
      expect(hppPaidRes.paid_reimburse_marketing).toBe(15000);
      expect(hppPaidRes.unpaid_profit_share_marketing).toBe(28000);
      expect(hppPaidRes.total_unpaid_marketing).toBe(28000);
    });

    it('Scenario 4: Asymmetrical Split HPP (30% Marketing : 70% Platform)', () => {
      // Deal 100.000, HPP 30.000. Gross profit = 70.000
      // Fee 10% = 7.000. Transport = 20.000. Net split profit = 43.000
      // Marketing HPP (30%) = 9.000. Marketing share (30% of 43.000) = 12.900
      // Marketing profit share = 20.000 + 12.900 = 32.900
      const res = calculateVenueSettlement({
        deal_amount: 100000,
        hpp: 30000,
        hpp_payer: 'split',
        hpp_marketing_ratio: 30,
        transport_fee: 20000,
        hpp_reimburse_status: 'unpaid',
        profit_share_status: 'unpaid',
      });

      expect(res.reimburse_marketing).toBe(9000);
      expect(res.profit_share_marketing).toBe(32900);
      expect(res.total_unpaid_marketing).toBe(9000 + 32900);
    });

    it('Scenario 5: Exact Rupiah Input for Split HPP without percentage rounding error', () => {
      // User sets exact Rupiah nominal: Total HPP 150.000, Marketing Rp 50.000 (1/3), Platform Rp 100.000 (2/3)
      // Deal 599.000. Gross profit = 449.000
      // Platform fee 10% = 44.900. Transport = 20.000. Net split profit = 384.100
      // Marketing share (1/3 of 384.100) = Math.round(384.100 * (50000/150000)) = 128.033
      // Platform share = 384.100 - 128.033 = 256.067
      const res = calculateVenueSettlement({
        deal_amount: 599000,
        hpp: 150000,
        hpp_payer: 'split',
        hpp_marketing_amount: 50000,
        transport_fee: 20000,
        hpp_reimburse_status: 'unpaid',
        profit_share_status: 'unpaid',
      });

      expect(res.reimburse_marketing).toBe(50000); // Exactly Rp 50.000, NOT Rp 49.999!
      expect(res.unpaid_reimburse_marketing).toBe(50000);
      expect(res.profit_share_marketing).toBe(20000 + 128033);
      expect(res.total_unpaid_marketing).toBe(50000 + 20000 + 128033);

      // Verify that after marking HPP paid:
      const paidRes = calculateVenueSettlement({
        deal_amount: 599000,
        hpp: 150000,
        hpp_payer: 'split',
        hpp_marketing_amount: 50000,
        transport_fee: 20000,
        hpp_reimburse_status: 'paid',
        profit_share_status: 'unpaid',
      });

      expect(paidRes.unpaid_reimburse_marketing).toBe(0);
      expect(paidRes.paid_reimburse_marketing).toBe(50000);
    });

    it('Scenario 6: Fault tolerance with 0 HPP and out-of-bounds Rupiah inputs (prevents NaN or divide-by-zero)', () => {
      // HPP is 0
      const zeroHpp = calculateVenueSettlement({
        deal_amount: 100000,
        hpp: 0,
        hpp_payer: 'split',
        hpp_marketing_amount: 0,
        transport_fee: 20000,
      });

      expect(zeroHpp.reimburse_marketing).toBe(0);
      expect(zeroHpp.reimburse_status).toBe('not_applicable');
      expect(isNaN(zeroHpp.total_unpaid_marketing)).toBe(false);

      // Marketing amount greater than HPP (should clamp safely)
      const clampedRes = calculateVenueSettlement({
        deal_amount: 100000,
        hpp: 30000,
        hpp_payer: 'split',
        hpp_marketing_amount: 999999, // Exceeds 30.000
        transport_fee: 20000,
      });

      expect(clampedRes.reimburse_marketing).toBe(30000); // Clamped to max HPP
      expect(isNaN(clampedRes.total_unpaid_marketing)).toBe(false);
    });
  });

  describe('API PATCH /api/admin/venues/settlement', () => {
    const createSuperAdminCookie = () => {
      const token = Buffer.from(
        JSON.stringify({
          authenticated: true,
          role: 'super_admin',
          name: 'Super Admin',
        })
      ).toString('base64');
      return `auth_session=${token}`;
    };

    const createSpecialistCookie = () => {
      const token = Buffer.from(
        JSON.stringify({
          authenticated: true,
          role: 'marketing_specialist',
          specialist_id: 'spec-1',
          name: 'Rian Specialist',
        })
      ).toString('base64');
      return `auth_session=${token}`;
    };

    it('allows Super Admin to settle HPP only with transfer reference notes', async () => {
      const venue = await dataStore.createVenue({
        name: 'Kafe Split Settlement',
        slug: 'kafe-split-settlement',
        google_review_url: 'https://maps.google.com/review',
        redirect_mode: 'smart_funnel',
        feedback_channels: 'whatsapp',
        owner_access_pin: '8888',
        is_active: true,
        deal_amount: 70000,
        hpp: 30000,
        hpp_payer: 'split',
        hpp_marketing_ratio: 50,
        transport_fee: 20000,
        deal_date: '2026-09-12',
      });

      expect(venue.hpp_reimburse_status).toBe('unpaid');
      expect(venue.profit_share_status).toBe('unpaid');

      // Super admin marks HPP reimburse as paid
      const req = new Request('http://localhost:3000/api/admin/venues/settlement', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': createSuperAdminCookie(),
        },
        body: JSON.stringify({
          venue_id: venue.id,
          type: 'hpp_reimburse',
          status: 'paid',
          notes: 'Transfer Reimburse 50% HPP Rp 15.000 via BCA #99812',
        }),
      });

      const res = await settlementPatch(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.venue.hpp_reimburse_status).toBe('paid');
      expect(json.venue.hpp_reimburse_notes).toBe('Transfer Reimburse 50% HPP Rp 15.000 via BCA #99812');
      expect(json.venue.profit_share_status).toBe('unpaid'); // Profit share still unpaid!
    });

    it('allows Super Admin to settle Bagi Hasil only', async () => {
      const venue = await dataStore.createVenue({
        name: 'Kafe Profit Only',
        slug: 'kafe-profit-only',
        google_review_url: 'https://maps.google.com/review',
        redirect_mode: 'smart_funnel',
        feedback_channels: 'whatsapp',
        owner_access_pin: '8888',
        is_active: true,
        deal_amount: 70000,
        hpp: 30000,
        hpp_payer: 'split',
        hpp_marketing_ratio: 50,
        transport_fee: 20000,
        deal_date: '2026-09-12',
      });

      const req = new Request('http://localhost:3000/api/admin/venues/settlement', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': createSuperAdminCookie(),
        },
        body: JSON.stringify({
          venue_id: venue.id,
          type: 'profit_share',
          status: 'paid',
          notes: 'Transfer Bagi Hasil Rp 28.000 via Mandiri',
        }),
      });

      const res = await settlementPatch(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.venue.profit_share_status).toBe('paid');
      expect(json.venue.hpp_reimburse_status).toBe('unpaid'); // HPP remains unpaid
    });

    it('prevents marketing specialist from updating settlement status', async () => {
      const venue = await dataStore.createVenue({
        name: 'Kafe Protected Settlement',
        slug: 'kafe-protected-settlement',
        google_review_url: 'https://maps.google.com/review',
        redirect_mode: 'smart_funnel',
        feedback_channels: 'whatsapp',
        owner_access_pin: '8888',
        is_active: true,
        deal_amount: 70000,
        hpp: 30000,
        deal_date: '2026-09-12',
      });

      const req = new Request('http://localhost:3000/api/admin/venues/settlement', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': createSpecialistCookie(),
        },
        body: JSON.stringify({
          venue_id: venue.id,
          type: 'both',
          status: 'paid',
        }),
      });

      const res = await settlementPatch(req);
      expect(res.status).toBe(403);
    });
  });
});
