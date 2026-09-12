/**
 * Utility functions for Indonesian Rupiah (IDR) currency formatting,
 * parsing, compact representation, and "Terbilang" conversion.
 */

/**
 * Format a number to IDR string without symbol, e.g. 599000 -> "599.000"
 */
export function formatRupiahNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return Math.round(value).toLocaleString('id-ID');
}

/**
 * Parse a localized IDR string to raw integer number, e.g. "599.000" -> 599000
 */
export function parseRupiahNumber(input: string | number | undefined | null): number {
  if (input === undefined || input === null) return 0;
  if (typeof input === 'number') return isNaN(input) ? 0 : Math.round(input);
  const cleaned = input.toString().replace(/\D/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

/**
 * Format number to compact readable Rupiah, e.g. 599000 -> "Rp 599 rb", 1500000 -> "Rp 1,5 jt"
 */
export function formatCompactRupiah(value: number): string {
  if (!value || isNaN(value) || value <= 0) return 'Rp 0';
  if (value >= 1000000000) {
    const m = (value / 1000000000).toFixed(1).replace(/\.0$/, '').replace('.', ',');
    return `Rp ${m} M`;
  }
  if (value >= 1000000) {
    const jt = (value / 1000000).toFixed(1).replace(/\.0$/, '').replace('.', ',');
    return `Rp ${jt} jt`;
  }
  if (value >= 1000) {
    const rb = (value / 1000).toFixed(0);
    return `Rp ${rb} rb`;
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
}

/**
 * Helper recursion to convert number to Indonesian words
 */
function terbilangAngka(n: number): string {
  if (n < 0) return 'minus ' + terbilangAngka(Math.abs(n));
  n = Math.floor(n);
  if (n === 0) return 'nol';

  const satuan = [
    '', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
    'sepuluh', 'sebelas'
  ];

  if (n < 12) {
    return satuan[n];
  } else if (n < 20) {
    return terbilangAngka(n - 10) + ' belas';
  } else if (n < 100) {
    const sisa = n % 10;
    return terbilangAngka(Math.floor(n / 10)) + ' puluh' + (sisa ? ' ' + satuan[sisa] : '');
  } else if (n < 200) {
    const sisa = n - 100;
    return 'seratus' + (sisa ? ' ' + terbilangAngka(sisa) : '');
  } else if (n < 1000) {
    const sisa = n % 100;
    return terbilangAngka(Math.floor(n / 100)) + ' ratus' + (sisa ? ' ' + terbilangAngka(sisa) : '');
  } else if (n < 2000) {
    const sisa = n - 1000;
    return 'seribu' + (sisa ? ' ' + terbilangAngka(sisa) : '');
  } else if (n < 1000000) {
    const sisa = n % 1000;
    return terbilangAngka(Math.floor(n / 1000)) + ' ribu' + (sisa ? ' ' + terbilangAngka(sisa) : '');
  } else if (n < 1000000000) {
    const sisa = n % 1000000;
    return terbilangAngka(Math.floor(n / 1000000)) + ' juta' + (sisa ? ' ' + terbilangAngka(sisa) : '');
  } else if (n < 1000000000000) {
    const sisa = n % 1000000000;
    return terbilangAngka(Math.floor(n / 1000000000)) + ' miliar' + (sisa ? ' ' + terbilangAngka(sisa) : '');
  }
  return n.toLocaleString('id-ID');
}

/**
 * Convert number into formal Indonesian "Terbilang" phrase
 * e.g. 599000 -> "Lima ratus sembilan puluh sembilan ribu rupiah"
 */
export function terbilangRupiah(value: number): string {
  if (value === 0 || !value || isNaN(value)) return 'Nol rupiah';
  const text = terbilangAngka(value);
  return text.charAt(0).toUpperCase() + text.slice(1) + ' rupiah';
}
