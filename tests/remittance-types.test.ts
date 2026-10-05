import { describe, it, expect } from 'vitest';
import { RemittanceStatus, Venue } from '@/lib/types';

describe('Remittance Types & Defaults', () => {
  it('should support valid RemittanceStatus values', () => {
    const statuses: RemittanceStatus[] = ['unpaid', 'submitted', 'verified', 'not_applicable'];
    expect(statuses).toHaveLength(4);
  });

  it('should accept remittance fields on Venue objects', () => {
    const testVenue: Partial<Venue> = {
      id: 'test-v1',
      remittance_status: 'submitted',
      remittance_amount: 194900,
      remittance_notes: 'Transfer via BCA ref #89123',
      remittance_paid_at: '2026-10-06T10:00:00Z',
    };
    expect(testVenue.remittance_status).toBe('submitted');
    expect(testVenue.remittance_amount).toBe(194900);
  });
});
