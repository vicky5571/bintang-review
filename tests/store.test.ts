import { describe, it, expect, beforeEach } from 'vitest';
import { dataStore } from '@/lib/store';

describe('DataStore Repository', () => {
  beforeEach(() => {
    dataStore.reset();
  });

  it('should retrieve seeded venue by slug', async () => {
    const venue = await dataStore.getVenueBySlug('kopi-senja');
    expect(venue).not.toBeNull();
    expect(venue?.slug).toBe('kopi-senja');
    expect(venue?.name).toBe('Kopi Senja Utama');
    expect(venue?.redirect_mode).toBe('smart_funnel');
  });

  it('should log a scan and calculate venue analytics correctly', async () => {
    const venue = await dataStore.getVenueBySlug('kopi-senja');
    expect(venue).not.toBeNull();

    await dataStore.logScan({
      venue_id: venue!.id,
      device_type: 'iOS',
      action_taken: 'positive_review',
      rating_selected: 5,
    });

    await dataStore.logScan({
      venue_id: venue!.id,
      device_type: 'Android',
      action_taken: 'negative_feedback',
      rating_selected: 2,
    });

    const analytics = await dataStore.getVenueAnalytics(venue!.id);
    expect(analytics.total_scans).toBe(2);
    expect(analytics.positive_count).toBe(1);
    expect(analytics.negative_count).toBe(1);
    expect(analytics.satisfaction_rate).toBe(50);
  });

  it('should save private feedback message', async () => {
    const venue = await dataStore.getVenueBySlug('kopi-senja');
    const msg = await dataStore.saveFeedback({
      venue_id: venue!.id,
      customer_name: 'Budi',
      customer_contact: '081234567890',
      table_number: '05',
      rating: 2,
      message: 'Kopinya agak asam dan ac kurang dingin.',
    });

    expect(msg.id).toBeDefined();
    expect(msg.message).toContain('Kopinya agak asam');

    const list = await dataStore.listFeedback(venue!.id);
    expect(list.length).toBe(1);
    expect(list[0].customer_name).toBe('Budi');
  });
});
