import { describe, it, expect, beforeEach } from 'vitest';
import { calculateProfitDistribution, calculateMonthlyNetProfitWithServerCost } from '@/lib/profitSharing';
import { dataStore } from '@/lib/store';
import { POST as venuesPost } from '@/app/api/admin/venues/route';

describe('Profit Distribution & Flexible HPP Reimbursement Business Flow', () => {
  beforeEach(() => {
    dataStore.reset();
  });

  describe('Pure calculation unit tests', () => {
    it('should correctly calculate User Scenario A: 100% Marketing HPP (Deal 70k, HPP 30k, Transport 20k)', () => {
      const res = calculateProfitDistribution({
        deal_amount: 70000,
        hpp: 30000,
        hpp_payer: 'marketing',
        transport_fee: 20000,
      });

      expect(res.deal_amount).toBe(70000);
      expect(res.hpp).toBe(30000);
      expect(res.gross_profit).toBe(40000);

      // Step 1: Reimburse HPP
      expect(res.reimburse_marketing).toBe(30000);
      expect(res.reimburse_platform).toBe(0);

      // Step 2: Sisa Profit 40.000
      expect(res.platform_fee_10).toBe(4000); // 10% dari 40.000
      expect(res.marketing_transport).toBe(20000); // Flat transport 20.000
      expect(res.net_split_profit).toBe(16000); // 40.000 - 4.000 - 20.000

      // Step 3: Pembagian sisa profit (100% ke marketing)
      expect(res.marketing_final_share).toBe(16000);
      expect(res.platform_final_share).toBe(0);

      // Total Payouts
      expect(res.marketing_total_payout).toBe(66000); // 30.000 reimb + 20.000 trans + 16.000 share
      expect(res.platform_total_payout).toBe(4000); // 4.000 fee 10%
      expect(res.marketing_total_payout + res.platform_total_payout).toBe(70000);
    });

    it('should correctly calculate User Scenario B: 100% Platform HPP (Deal 70k, HPP 30k, Transport 20k)', () => {
      const res = calculateProfitDistribution({
        deal_amount: 70000,
        hpp: 30000,
        hpp_payer: 'platform',
        transport_fee: 20000,
      });

      expect(res.gross_profit).toBe(40000);

      // Step 1: Reimburse HPP ke Platform
      expect(res.reimburse_marketing).toBe(0);
      expect(res.reimburse_platform).toBe(30000);

      // Step 2: Sisa Profit 40.000
      expect(res.platform_fee_10).toBe(4000);
      expect(res.marketing_transport).toBe(20000);
      expect(res.net_split_profit).toBe(16000);

      // Step 3: Pembagian sisa profit (100% ke platform)
      expect(res.marketing_final_share).toBe(0);
      expect(res.platform_final_share).toBe(16000);

      // Total Payouts
      expect(res.marketing_total_payout).toBe(20000); // 20.000 trans
      expect(res.platform_total_payout).toBe(50000); // 30.000 reimb + 4.000 fee + 16.000 share
      expect(res.marketing_total_payout + res.platform_total_payout).toBe(70000);
    });

    it('should correctly calculate User Scenario C: 50:50 Split HPP (Deal 70k, HPP 30k, Transport 20k)', () => {
      const res = calculateProfitDistribution({
        deal_amount: 70000,
        hpp: 30000,
        hpp_payer: 'split',
        hpp_marketing_ratio: 50,
        transport_fee: 20000,
      });

      expect(res.gross_profit).toBe(40000);

      // Step 1: Reimburse HPP 50:50
      expect(res.reimburse_marketing).toBe(15000);
      expect(res.reimburse_platform).toBe(15000);

      // Step 2: Sisa Profit 40.000
      expect(res.platform_fee_10).toBe(4000);
      expect(res.marketing_transport).toBe(20000);
      expect(res.net_split_profit).toBe(16000);

      // Step 3: Pembagian sisa profit 50:50
      expect(res.marketing_final_share).toBe(8000);
      expect(res.platform_final_share).toBe(8000);

      // Total Payouts
      expect(res.marketing_total_payout).toBe(43000); // 15.000 reimb + 20.000 trans + 8.000 share
      expect(res.platform_total_payout).toBe(27000); // 15.000 reimb + 4.000 fee + 8.000 share
      expect(res.marketing_total_payout + res.platform_total_payout).toBe(70000);
    });

    it('should handle typical production numbers: Deal 599.000, HPP 150.000, Transport 20.000', () => {
      const res = calculateProfitDistribution({
        deal_amount: 599000,
        hpp: 150000,
        hpp_payer: 'marketing',
        transport_fee: 20000,
      });

      expect(res.gross_profit).toBe(449000);
      expect(res.reimburse_marketing).toBe(150000);
      expect(res.platform_fee_10).toBe(44900);
      expect(res.marketing_transport).toBe(20000);
      expect(res.net_split_profit).toBe(384100);
      expect(res.marketing_total_payout).toBe(150000 + 20000 + 384100); // 554100
      expect(res.platform_total_payout).toBe(44900);
      expect(res.marketing_total_payout + res.platform_total_payout).toBe(599000);
    });

    it('should gracefully handle zero profit or edge cases without crashing', () => {
      const res = calculateProfitDistribution({
        deal_amount: 30000,
        hpp: 30000,
        hpp_payer: 'marketing',
        transport_fee: 20000,
      });

      expect(res.gross_profit).toBe(0);
      expect(res.reimburse_marketing).toBe(30000);
      expect(res.platform_fee_10).toBe(0);
      expect(res.marketing_transport).toBe(0);
      expect(res.net_split_profit).toBe(0);
      expect(res.marketing_total_payout).toBe(30000);
      expect(res.platform_total_payout).toBe(0);
    });

    it('Scenario D: Subscription Model (Zero HPP - e.g. Rp 149.000/mo recurring)', () => {
      const res = calculateProfitDistribution({
        deal_amount: 149000,
        hpp: 0,
        closing_specialist_name: 'Vicky Galih Pamungkas',
      });

      expect(res.deal_amount).toBe(149000);
      expect(res.hpp).toBe(0);
      expect(res.gross_profit).toBe(149000);
      expect(res.marketing_transport).toBe(0); // Default 0 for zero HPP
      expect(res.developer_fee_10).toBe(14900); // 10% dari 149.000
      expect(res.net_split_profit).toBe(134100); // 90% sisa laba bersih

      // 100% net profit to closing marketing specialist
      expect(res.marketing_final_share).toBe(134100);
      expect(res.marketing_total_payout).toBe(134100);

      // Developer fee 14.900 reciprocal: Vicky closed -> 100% to Natan
      expect(res.developer_fee_recipient).toBe('natan');
      expect(res.developer_fee_natan).toBe(14900);
      expect(res.developer_fee_vicky).toBe(0);
      expect(res.marketing_total_payout + res.developer_fee_10).toBe(149000);
    });

    it('Scenario E: Reciprocal Developer Fee when Natan closes the deal', () => {
      const res = calculateProfitDistribution({
        deal_amount: 70000,
        hpp: 30000,
        hpp_payer: 'marketing',
        transport_fee: 20000,
        closing_specialist_name: 'Natan Setyo Agung',
      });

      expect(res.gross_profit).toBe(40000);
      expect(res.developer_fee_10).toBe(4000); // 10%
      // Deal closed by Natan -> 100% of Developer Fee to Vicky
      expect(res.developer_fee_recipient).toBe('vicky');
      expect(res.developer_fee_vicky).toBe(4000);
      expect(res.developer_fee_natan).toBe(0);
      expect(res.marketing_total_payout).toBe(66000); // 30k reimb + 20k trans + 16k profit
    });

    it('Scenario F: Reciprocal Developer Fee when external specialist closes the deal (split 50:50)', () => {
      const res = calculateProfitDistribution({
        deal_amount: 70000,
        hpp: 30000,
        hpp_payer: 'marketing',
        transport_fee: 20000,
        closing_specialist_name: 'Budi Santoso',
      });

      expect(res.developer_fee_10).toBe(4000);
      // Deal closed by external agent -> 50:50 between Vicky & Natan
      expect(res.developer_fee_recipient).toBe('split');
      expect(res.developer_fee_vicky).toBe(2000);
      expect(res.developer_fee_natan).toBe(2000);
    });

    it('Scenario G: Monthly Net Profit with Server Operating Cost & 51%-49% Equity Dividend', () => {
      const monthly = calculateMonthlyNetProfitWithServerCost({
        total_gross_revenue: 10000000, // Rp 10.000.000
        total_hpp_cost: 2000000,       // Rp 2.000.000
        server_operating_cost: 500000, // Rp 500.000 (Supabase, Vercel, Domain, WA)
      });

      expect(monthly.gross_profit).toBe(8000000);
      expect(monthly.net_profit_before_server).toBe(8000000);
      expect(monthly.net_profit_after_server).toBe(7500000); // 8.000.000 - 500.000
      expect(monthly.developer_fee_pool).toBe(750000); // 10% dari 7.500.000
      expect(monthly.distributable_profit).toBe(6750000); // 7.500.000 - 750.000

      // Saham 51% Vicky, 49% Natan
      expect(monthly.vicky_equity_ratio).toBe(51);
      expect(monthly.natan_equity_ratio).toBe(49);
      expect(monthly.vicky_equity_dividend).toBe(3442500); // 51% * 6.750.000
      expect(monthly.natan_equity_dividend).toBe(3307500); // 49% * 6.750.000
      expect(monthly.vicky_equity_dividend + monthly.natan_equity_dividend).toBe(6750000);
    });
  });

  describe('Integration with API and Store', () => {
    it('should persist and retrieve hpp_payer, hpp_marketing_ratio, and transport_fee via API', async () => {
      const req = new Request('http://localhost:3000/api/admin/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Kafe Delta Sharing',
          slug: 'kafe-delta-sharing',
          google_review_url: 'https://maps.google.com/review',
          redirect_mode: 'smart_funnel',
          feedback_channels: 'whatsapp',
          owner_access_pin: '7777',
          is_active: true,
          deal_amount: 70000,
          hpp: 30000,
          hpp_payer: 'split',
          hpp_marketing_ratio: 50,
          transport_fee: 20000,
          billing_type: 'one_time',
          monthly_retainer_fee: 0,
        }),
      });

      const res = await venuesPost(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.venue.hpp_payer).toBe('split');
      expect(body.venue.hpp_marketing_ratio).toBe(50);
      expect(body.venue.transport_fee).toBe(20000);

      // Verify calculation
      const dist = calculateProfitDistribution({
        deal_amount: body.venue.deal_amount,
        hpp: body.venue.hpp,
        hpp_payer: body.venue.hpp_payer,
        hpp_marketing_ratio: body.venue.hpp_marketing_ratio,
        transport_fee: body.venue.transport_fee,
      });
      expect(dist.marketing_total_payout).toBe(43000);
      expect(dist.platform_total_payout).toBe(27000);
    });
  });
});
