import { describe, it, expect, beforeEach } from 'vitest';
import { dataStore } from '@/lib/store';

describe('Manual Payment & Subscription Verification Flow', () => {
  beforeEach(() => {
    dataStore.reset();
  });

  it('should submit a manual payment confirmation from client', async () => {
    const venue = await dataStore.getVenueBySlug('kopi-senja');
    expect(venue).not.toBeNull();

    const confirmation = await dataStore.submitPaymentConfirmation({
      venue_id: venue!.id,
      amount: 49000,
      payment_method: 'Transfer BCA',
      sender_name: 'Budi Santoso',
      notes: 'Ref: TRF20260912001',
    });

    expect(confirmation.id).toBeDefined();
    expect(confirmation.status).toBe('pending');
    expect(confirmation.amount).toBe(49000);

    // Venue status should be updated to pending_verification
    const updatedVenue = await dataStore.getVenueById(venue!.id);
    expect(updatedVenue?.subscription_status).toBe('pending_verification');
  });

  it('should list pending payment confirmations in admin', async () => {
    const venue = await dataStore.getVenueBySlug('kopi-senja');
    await dataStore.submitPaymentConfirmation({
      venue_id: venue!.id,
      amount: 49000,
      payment_method: 'QRIS',
      sender_name: 'Dewi Lestari',
    });

    const pendingList = await dataStore.listPaymentConfirmations();
    expect(pendingList.length).toBeGreaterThan(0);
    const found = pendingList.find((p) => p.venue_id === venue!.id);
    expect(found).toBeDefined();
    expect(found?.sender_name).toBe('Dewi Lestari');
  });

  it('should allow admin to approve payment and extend venue subscription by 30 days', async () => {
    const venue = await dataStore.getVenueBySlug('kopi-senja');
    const confirmation = await dataStore.submitPaymentConfirmation({
      venue_id: venue!.id,
      amount: 49000,
      payment_method: 'Transfer Mandiri',
      sender_name: 'Ahmad Fauzi',
    });

    const verified = await dataStore.verifyPaymentConfirmation(confirmation.id, 'approved', 'Verified by Super Admin');
    expect(verified?.status).toBe('approved');
    expect(verified?.verified_at).toBeDefined();

    const activeVenue = await dataStore.getVenueById(venue!.id);
    expect(activeVenue?.subscription_status).toBe('active');
    expect(activeVenue?.subscription_until).toBeDefined();

    // Verify date is set ~30 days in future
    const subDate = new Date(activeVenue!.subscription_until!);
    const now = new Date();
    const diffDays = Math.round((subDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(29);
  });

  it('should allow admin to reject payment with notes', async () => {
    const venue = await dataStore.getVenueBySlug('kopi-senja');
    const confirmation = await dataStore.submitPaymentConfirmation({
      venue_id: venue!.id,
      amount: 49000,
      payment_method: 'Transfer BCA',
      sender_name: 'Unknown',
    });

    const rejected = await dataStore.verifyPaymentConfirmation(confirmation.id, 'rejected', 'Bukti transfer tidak ditemukan');
    expect(rejected?.status).toBe('rejected');

    const updatedVenue = await dataStore.getVenueById(venue!.id);
    expect(updatedVenue?.subscription_status).toBe('expired');
  });
});
