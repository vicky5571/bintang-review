import { describe, it, expect } from 'vitest';
import { formatWhatsAppFeedbackUrl } from '@/components/PrivateFeedbackModal';

describe('Smart Funnel Business Logic', () => {
  it('should format WhatsApp complaint URL properly with Indonesian message and encoded parameters', () => {
    const url = formatWhatsAppFeedbackUrl({
      whatsappNumber: '628123456789',
      venueName: 'Kopi Senja Utama',
      rating: 2,
      tableNumber: '12',
      customerName: 'Siti',
      message: 'Pelayanan agak lama',
    });

    expect(url).toContain('https://wa.me/628123456789?text=');
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain('Halo Manajemen Kopi Senja Utama');
    expect(decoded).toContain('Rating: 2/5');
    expect(decoded).toContain('Meja: 12');
    expect(decoded).toContain('Siti');
    expect(decoded).toContain('Pelayanan agak lama');
  });

  it('should clean non-numeric characters from WhatsApp phone numbers', () => {
    const url = formatWhatsAppFeedbackUrl({
      whatsappNumber: '+62 812-3456-7890',
      venueName: 'Kopi Senja',
      rating: 1,
      message: 'AC mati',
    });
    expect(url).toContain('https://wa.me/6281234567890?text=');
  });
});
