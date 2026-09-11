import { describe, it, expect, beforeEach } from 'vitest';
import { dataStore } from '@/lib/store';

describe('Admin Management Operations', () => {
  beforeEach(() => {
    dataStore.reset();
  });

  it('should create a new client venue with custom slug and settings', async () => {
    const venue = await dataStore.createVenue({
      slug: 'warung-kopi-sedap',
      name: 'Warung Kopi Sedap',
      google_review_url: 'https://maps.google.com/review',
      redirect_mode: 'direct_google',
      feedback_channels: 'whatsapp',
      whatsapp_number: '628987654321',
      owner_access_pin: '5678',
      is_active: true,
      deal_amount: 499000,
      monthly_retainer_fee: 49000,
      deal_date: '2026-09-12',
    });

    expect(venue.id).toBeDefined();
    expect(venue.slug).toBe('warung-kopi-sedap');
    expect(venue.redirect_mode).toBe('direct_google');
  });

  it('should toggle venue status between active and inactive', async () => {
    const venue = await dataStore.getVenueBySlug('kopi-senja');
    expect(venue).not.toBeNull();

    const updated = await dataStore.updateVenue(venue!.id, { is_active: false });
    expect(updated?.is_active).toBe(false);
  });
});
