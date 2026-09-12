import { describe, it, expect } from 'vitest';
import { calculateProfitDistribution, calculateVenueSettlement } from '../src/lib/profitSharing';
import { HppBearer } from '../src/lib/types';
import { InMemoryStore } from '../src/lib/store';

describe('Multi-Bearer HPP Split and Profit Distribution', () => {
  it('Scenario 1: Two Marketing Specialists Split (No Platform Modal)', () => {
    // Specialist A closes the deal and contributes Rp 60.000
    // Specialist B contributes Rp 40.000
    // Total HPP = Rp 100.000
    // Deal Amount = Rp 200.000
    const bearers: HppBearer[] = [
      {
        id: 'bearer-spec-a',
        type: 'marketing',
        specialist_id: 'spec-a-id',
        name: 'Rian Marketing A',
        amount: 60000,
        ratio: 60,
      },
      {
        id: 'bearer-spec-b',
        type: 'marketing',
        specialist_id: 'spec-b-id',
        name: 'Budi Marketing B',
        amount: 40000,
        ratio: 40,
      },
    ];

    const dist = calculateProfitDistribution({
      deal_amount: 200000,
      hpp: 100000,
      hpp_bearers: bearers,
      closing_specialist_id: 'spec-a-id',
      transport_fee: 20000,
    });

    // 1. Gross Profit
    expect(dist.gross_profit).toBe(100000);
    // 2. 10% platform fee
    expect(dist.platform_fee_10).toBe(10000);
    // 3. Transport fee
    expect(dist.marketing_transport).toBe(20000);
    // 4. Net Split Profit: 100k - 10k - 20k = 70k
    expect(dist.net_split_profit).toBe(70000);

    expect(dist.bearers_summary).toHaveLength(2);

    const specASummary = dist.bearers_summary[0];
    const specBSummary = dist.bearers_summary[1];

    // Specialist A:
    // Reimburse: 60k
    // Transport: 20k (closing specialist)
    // Share: 60% of 70k = 42k
    // Total Payout: 60k + 20k + 42k = 122k
    expect(specASummary.reimburse).toBe(60000);
    expect(specASummary.transport).toBe(20000);
    expect(specASummary.final_share).toBe(42000);
    expect(specASummary.total_payout).toBe(122000);
    expect(specASummary.net_income).toBe(62000); // 122k - 60k

    // Specialist B:
    // Reimburse: 40k
    // Transport: 0 (not the closer)
    // Share: 40% of 70k = 28k
    // Total Payout: 40k + 0 + 28k = 68k
    expect(specBSummary.reimburse).toBe(40000);
    expect(specBSummary.transport).toBe(0);
    expect(specBSummary.final_share).toBe(28000);
    expect(specBSummary.total_payout).toBe(68000);
    expect(specBSummary.net_income).toBe(28000); // 68k - 40k

    // Total payouts verification (Cash in must strictly equal cash out):
    // 122k (Spec A) + 68k (Spec B) + 10k (Platform Fee) = 200k
    expect(specASummary.total_payout + specBSummary.total_payout + dist.platform_total_payout).toBe(200000);
  });

  it('Scenario 2: Three-Way Split (Specialist A + Specialist B + Platform Kas) with Odd Numbers', () => {
    // Total HPP = 150.000
    // Specialist A: 50.000
    // Specialist B: 50.000
    // Platform: 50.000
    // Deal: 290.000 (creates odd split numbers)
    const bearers: HppBearer[] = [
      {
        id: 'b-a',
        type: 'marketing',
        specialist_id: 'spec-a',
        name: 'Specialist A',
        amount: 50000,
        ratio: 33.33,
      },
      {
        id: 'b-b',
        type: 'marketing',
        specialist_id: 'spec-b',
        name: 'Specialist B',
        amount: 50000,
        ratio: 33.33,
      },
      {
        id: 'b-p',
        type: 'platform',
        specialist_id: null,
        name: 'Kas Platform',
        amount: 50000,
        ratio: 33.34,
      },
    ];

    const dist = calculateProfitDistribution({
      deal_amount: 290000,
      hpp: 150000,
      hpp_bearers: bearers,
      closing_specialist_id: 'spec-b', // Specialist B closed this deal
      transport_fee: 20000,
    });

    expect(dist.gross_profit).toBe(140000);
    expect(dist.platform_fee_10).toBe(14000);
    expect(dist.marketing_transport).toBe(20000);
    expect(dist.net_split_profit).toBe(106000); // 140k - 14k - 20k

    // Check transport is strictly given to Specialist B (the closer)
    const summaryB = dist.bearers_summary.find((s) => s.bearer.id === 'b-b')!;
    const summaryA = dist.bearers_summary.find((s) => s.bearer.id === 'b-a')!;
    const summaryP = dist.bearers_summary.find((s) => s.bearer.id === 'b-p')!;

    expect(summaryB.transport).toBe(20000);
    expect(summaryA.transport).toBe(0);
    expect(summaryP.transport).toBe(0);

    // Zero-drift test: Sum of final_shares across all bearers must strictly equal net_split_profit
    const sumShares = summaryA.final_share + summaryB.final_share + summaryP.final_share;
    expect(sumShares).toBe(dist.net_split_profit);

    // Sum of all payouts must strictly equal deal_amount
    const totalOut = summaryA.total_payout + summaryB.total_payout + summaryP.total_payout + dist.platform_fee_10;
    expect(totalOut).toBe(290000);
  });

  it('Scenario 3: Multi-Bearer Independent Settlement Workflow (Option B)', () => {
    const venue = {
      id: 'venue-split-multi',
      name: 'Kafe Kopi Dua Sahabat',
      deal_amount: 100000,
      hpp: 40000,
      hpp_payer: 'split' as const,
      sales_id: 'agent-1',
      transport_fee: 20000,
      hpp_bearers: [
        {
          id: 'bearer-1',
          type: 'marketing' as const,
          specialist_id: 'agent-1',
          name: 'Agent 1',
          amount: 20000,
          ratio: 50,
          reimburse_status: 'unpaid' as const,
          profit_share_status: 'unpaid' as const,
        },
        {
          id: 'bearer-2',
          type: 'marketing' as const,
          specialist_id: 'agent-2',
          name: 'Agent 2',
          amount: 20000,
          ratio: 50,
          reimburse_status: 'unpaid' as const,
          profit_share_status: 'unpaid' as const,
        },
      ],
      hpp_reimburse_status: 'unpaid' as const,
      profit_share_status: 'unpaid' as const,
    };

    // Initially both are unpaid
    let settlement = calculateVenueSettlement(venue);
    expect(settlement.reimburse_status).toBe('unpaid');
    expect(settlement.profit_share_status).toBe('unpaid');
    expect(settlement.unpaid_reimburse_marketing).toBe(40000);
    expect(settlement.bearers_settlement).toHaveLength(2);

    // Settle Agent 1 reimburse only
    venue.hpp_bearers[0].reimburse_status = 'paid';
    settlement = calculateVenueSettlement(venue);

    // Overall venue reimburse is still 'unpaid' because Agent 2 is not paid yet
    expect(settlement.reimburse_status).toBe('unpaid');
    expect(settlement.paid_reimburse_marketing).toBe(20000);
    expect(settlement.unpaid_reimburse_marketing).toBe(20000);

    // Settle Agent 2 reimburse
    venue.hpp_bearers[1].reimburse_status = 'paid';
    settlement = calculateVenueSettlement(venue);

    // Now overall venue reimburse automatically becomes 'paid'!
    expect(settlement.reimburse_status).toBe('paid');
    expect(settlement.paid_reimburse_marketing).toBe(40000);
    expect(settlement.unpaid_reimburse_marketing).toBe(0);
  });

  it('Scenario 4: Store persistence and commission tracking for co-funding specialists', async () => {
    const store = new InMemoryStore();

    // Create 2 specialists
    const specA = await store.createMarketingSpecialist({
      name: 'Specialist Alpha',
      email: 'alpha@test.com',
      phone: '0811111111',
      commission_type: 'percentage',
      commission_rate: 10,
    });

    const specB = await store.createMarketingSpecialist({
      name: 'Specialist Beta',
      email: 'beta@test.com',
      phone: '0822222222',
      commission_type: 'percentage',
      commission_rate: 10,
    });

    // Create venue closed by Spec A with co-funding by Spec B
    const venue = await store.createVenue({
      name: 'Joint Venture Cafe',
      slug: 'joint-venture-cafe',
      destination_url: 'https://maps.google.com',
      sales_id: specA.id,
      deal_amount: 200000,
      hpp: 100000,
      hpp_payer: 'split',
      hpp_bearers: [
        {
          id: 'b-alpha',
          type: 'marketing',
          specialist_id: specA.id,
          name: specA.name,
          amount: 50000,
          ratio: 50,
        },
        {
          id: 'b-beta',
          type: 'marketing',
          specialist_id: specB.id,
          name: specB.name,
          amount: 50000,
          ratio: 50,
        },
      ],
      transport_fee: 20000,
    });

    expect(venue.hpp_bearers).toBeDefined();
    expect(venue.hpp_bearers?.length).toBe(2);

    // List specialists and verify both receive earned commissions from this deal
    const specialists = await store.listMarketingSpecialists();
    const alpha = specialists.find((s) => s.id === specA.id)!;
    const beta = specialists.find((s) => s.id === specB.id)!;

    // Gross = 100k, Plat 10% = 10k, Transport = 20k (to Alpha). Net split = 70k.
    // Alpha total payout = 50k reimburse + 20k transport + 35k share = 105k
    // Beta total payout = 50k reimburse + 0 transport + 35k share = 85k
    expect(alpha.earned_commission).toBe(105000);
    expect(beta.earned_commission).toBe(85000);

    // Also listVenues by marketingId includes venues where specialist co-funds
    const betaVenues = await store.listVenues(specB.id);
    expect(betaVenues.some((v) => v.id === venue.id)).toBe(true);
  });
});
