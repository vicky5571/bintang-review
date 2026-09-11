import { describe, it, expect } from 'vitest';
import { generateNfcPayload, generateQrSvgString } from '@/lib/qr';

describe('QR & NFC Asset Generator', () => {
  it('should generate correct NFC URL payload', () => {
    const nfcUrl = generateNfcPayload('kopi-senja', 'https://bintangreview.id');
    expect(nfcUrl).toBe('https://bintangreview.id/r/kopi-senja');
  });

  it('should generate a valid SVG string from target URL', async () => {
    const svg = await generateQrSvgString('https://bintangreview.id/r/kopi-senja');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });
});
