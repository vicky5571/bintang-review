import { describe, it, expect, beforeEach } from 'vitest';
import { dataStore } from '@/lib/store';
import { generateNfcPayload, generateQrSvgString } from '@/lib/qr';
import { formatWhatsAppFeedbackUrl } from '@/components/PrivateFeedbackModal';

describe('Bintang Review Complete E2E Lifecycle', () => {
  beforeEach(() => {
    dataStore.reset();
  });

  it('should complete full cycle: admin creates venue -> QR generated -> customer taps & rates 5 -> analytics updated', async () => {
    // 1. Admin creates new client venue
    const venue = await dataStore.createVenue({
      slug: 'kopi-kenangan-senopati',
      name: 'Kopi Kenangan Senopati',
      google_review_url: 'https://maps.google.com/review/kopi-kenangan',
      redirect_mode: 'smart_funnel',
      feedback_channels: 'both',
      whatsapp_number: '628111222333',
      owner_access_pin: '4321',
      is_active: true,
      deal_amount: 599000,
      monthly_retainer_fee: 49000,
      deal_date: '2026-09-12',
    });

    expect(venue.id).toBeDefined();

    // 2. Hardware QR & NFC generated
    const nfcUrl = generateNfcPayload(venue.slug);
    const svg = await generateQrSvgString(nfcUrl);
    expect(nfcUrl).toContain('/r/kopi-kenangan-senopati');
    expect(svg).toContain('<svg');

    // 3. Customer taps and leaves 5-star rating
    await dataStore.logScan({
      venue_id: venue.id,
      device_type: 'iOS Mobile',
      action_taken: 'positive_review',
      rating_selected: 5,
    });

    // 4. Another customer leaves 2-star constructive criticism
    await dataStore.saveFeedback({
      venue_id: venue.id,
      customer_name: 'Dewi',
      table_number: '03',
      rating: 2,
      message: 'Kursinya agak berdebu',
    });
    await dataStore.logScan({
      venue_id: venue.id,
      device_type: 'Android Mobile',
      action_taken: 'negative_feedback',
      rating_selected: 2,
    });

    // 5. Owner checks analytics on portal
    const analytics = await dataStore.getVenueAnalytics(venue.id);
    expect(analytics.total_scans).toBe(2);
    expect(analytics.positive_count).toBe(1);
    expect(analytics.negative_count).toBe(1);
    expect(analytics.satisfaction_rate).toBe(50);

    const feedbacks = await dataStore.listFeedback(venue.id);
    expect(feedbacks.length).toBe(1);
    expect(feedbacks[0].customer_name).toBe('Dewi');

    // 6. Test WhatsApp routing formatter
    const waUrl = formatWhatsAppFeedbackUrl({
      whatsappNumber: venue.whatsapp_number!,
      venueName: venue.name,
      rating: 2,
      tableNumber: '03',
      customerName: 'Dewi',
      message: 'Kursinya agak berdebu',
    });
    expect(waUrl).toContain('628111222333');
    expect(decodeURIComponent(waUrl)).toContain('Kursinya agak berdebu');
  });
});
