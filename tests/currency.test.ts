import { describe, it, expect } from 'vitest';
import {
  formatRupiahNumber,
  parseRupiahNumber,
  formatCompactRupiah,
  terbilangRupiah,
} from '@/lib/currency';

describe('Currency Utility (IDR & Terbilang)', () => {
  it('should format numbers to localized Indonesian string with thousand dots', () => {
    expect(formatRupiahNumber(599000)).toBe('599.000');
    expect(formatRupiahNumber(150000)).toBe('150.000');
    expect(formatRupiahNumber(1500000)).toBe('1.500.000');
    expect(formatRupiahNumber(20000)).toBe('20.000');
    expect(formatRupiahNumber(0)).toBe('0');
  });

  it('should parse formatted string back to clean integer', () => {
    expect(parseRupiahNumber('599.000')).toBe(599000);
    expect(parseRupiahNumber('Rp 1.500.000')).toBe(1500000);
    expect(parseRupiahNumber('')).toBe(0);
    expect(parseRupiahNumber(20000)).toBe(20000);
    expect(parseRupiahNumber('abc 123.456 xyz')).toBe(123456);
  });

  it('should format numbers to humanized compact representation', () => {
    expect(formatCompactRupiah(599000)).toBe('Rp 599 rb');
    expect(formatCompactRupiah(1500000)).toBe('Rp 1,5 jt');
    expect(formatCompactRupiah(20000)).toBe('Rp 20 rb');
    expect(formatCompactRupiah(2500000000)).toBe('Rp 2,5 M');
    expect(formatCompactRupiah(0)).toBe('Rp 0');
  });

  it('should convert numbers to formal Indonesian Terbilang accurately', () => {
    expect(terbilangRupiah(0)).toBe('Nol rupiah');
    expect(terbilangRupiah(20000)).toBe('Dua puluh ribu rupiah');
    expect(terbilangRupiah(150000)).toBe('Seratus lima puluh ribu rupiah');
    expect(terbilangRupiah(599000)).toBe('Lima ratus sembilan puluh sembilan ribu rupiah');
    expect(terbilangRupiah(1500000)).toBe('Satu juta lima ratus ribu rupiah');
    expect(terbilangRupiah(2500000)).toBe('Dua juta lima ratus ribu rupiah');
  });
});
