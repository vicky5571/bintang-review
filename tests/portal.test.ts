import { describe, it, expect } from 'vitest';
import { verifyOwnerPin } from '@/components/OwnerPinModal';

describe('Owner Portal Authentication & Metrics', () => {
  it('should validate owner access PIN correctly', () => {
    const valid = verifyOwnerPin('1234', '1234');
    const invalid = verifyOwnerPin('9999', '1234');
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });
});
