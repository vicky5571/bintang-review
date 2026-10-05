import { describe, it, expect } from 'vitest';
import { formatRupiahNumber, parseRupiahNumber, formatCompactRupiah } from '@/lib/currency';

describe('Fast Smoke Test Suite (<1s)', () => {
  it('should format numbers to localized Indonesian Rupiah string', () => {
    expect(formatRupiahNumber(599000)).toBe('599.000');
    expect(formatRupiahNumber(150000)).toBe('150.000');
    expect(formatRupiahNumber(0)).toBe('0');
  });

  it('should parse formatted Rupiah string to clean integer', () => {
    expect(parseRupiahNumber('599.000')).toBe(599000);
    expect(parseRupiahNumber('Rp 150.000')).toBe(150000);
    expect(parseRupiahNumber('')).toBe(0);
  });

  it('should humanize currency to compact representation', () => {
    expect(formatCompactRupiah(599000)).toBe('Rp 599 rb');
    expect(formatCompactRupiah(1500000)).toBe('Rp 1,5 jt');
  });
});
