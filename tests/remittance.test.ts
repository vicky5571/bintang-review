import { describe, it, expect } from 'vitest';
import { calculateProfitDistribution, calculateVenueSettlement } from '@/lib/profitSharing';

describe('Field Remittance Accounting Engine', () => {
  it('should balance exactly with 100% marketing HPP (Zero Rounding Drift)', () => {
    // Deal: 599k, HPP: 150k (borne by marketing), Transport: 20k
    // Gross: 449k -> Dev Fee 10%: 44.9k, Transport: 20k, Net Split: 384.1k
    // Marketing keeps: 150k + 20k + 384.1k = 554.1k
    // Platform remittance due: 44.9k (Dev fee)
    const result = calculateProfitDistribution({
      deal_amount: 599000,
      hpp: 150000,
      hpp_payer: 'marketing',
      hpp_marketing_ratio: 100,
      transport_fee: 20000,
      closing_specialist_id: 'agent-1',
      closing_specialist_name: 'Budi Santoso',
    });

    expect(result.marketing_retained).toBe(554100);
    expect(result.platform_remittance_due).toBe(44900);
    expect(result.marketing_retained + result.platform_remittance_due).toBe(599000);
  });

  it('should balance exactly when Platform bears 100% HPP', () => {
    // Deal: 599k, HPP: 150k (borne by platform), Transport: 20k
    // Gross: 449k -> Dev Fee: 44.9k, Transport: 20k, Net Split: 384.1k (all to platform)
    // Marketing keeps: Transport: 20k
    // Platform remittance due: 150k (HPP modal) + 44.9k (Dev fee) + 384.1k (Platform share) = 579k
    const result = calculateProfitDistribution({
      deal_amount: 599000,
      hpp: 150000,
      hpp_payer: 'platform',
      hpp_marketing_ratio: 0,
      transport_fee: 20000,
      closing_specialist_id: 'agent-1',
      closing_specialist_name: 'Budi Santoso',
    });

    expect(result.marketing_retained).toBe(20000);
    expect(result.platform_remittance_due).toBe(579000);
    expect(result.marketing_retained + result.platform_remittance_due).toBe(599000);
  });

  it('should compute venue remittance in calculateVenueSettlement', () => {
    const summary = calculateVenueSettlement({
      deal_amount: 599000,
      hpp: 150000,
      hpp_payer: 'marketing',
      remittance_status: 'unpaid',
    });

    expect(summary.remittance_due).toBe(44900);
    expect(summary.remittance_status).toBe('unpaid');
    expect(summary.marketing_retained).toBe(554100);
  });
});
