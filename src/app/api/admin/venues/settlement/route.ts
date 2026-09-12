import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';
import { getSessionFromRequest } from '@/lib/auth';
import { calculateProfitDistribution } from '@/lib/profitSharing';

export async function PATCH(request: Request) {
  try {
    const session = getSessionFromRequest(request);

    // Only super_admin can disburse/settle payouts
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Hanya Super Admin yang berhak menandai pelunasan reimbursement atau bagi hasil.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { venue_id, type, status, notes } = body;

    if (!venue_id || !type || !status) {
      return NextResponse.json(
        { error: 'venue_id, type (hpp_reimburse / profit_share / both), dan status (paid / unpaid) wajib diisi.' },
        { status: 400 }
      );
    }

    const venue = await dataStore.getVenueById(venue_id);
    if (!venue) {
      return NextResponse.json(
        { error: 'Venue tidak ditemukan.' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const updates: any = {};

    const dist = calculateProfitDistribution({
      deal_amount: venue.deal_amount,
      hpp: venue.hpp,
      hpp_payer: venue.hpp_payer,
      hpp_marketing_ratio: venue.hpp_marketing_ratio,
      transport_fee: venue.transport_fee,
    });

    if (type === 'hpp_reimburse' || type === 'both') {
      if (dist.reimburse_marketing === 0) {
        updates.hpp_reimburse_status = 'not_applicable';
        updates.hpp_reimburse_paid_at = null;
      } else {
        updates.hpp_reimburse_status = status;
        updates.hpp_reimburse_paid_at = status === 'paid' ? now : null;
      }
      if (notes !== undefined) {
        updates.hpp_reimburse_notes = notes;
      }
    }

    if (type === 'profit_share' || type === 'both') {
      updates.profit_share_status = status;
      updates.profit_share_paid_at = status === 'paid' ? now : null;
      if (notes !== undefined) {
        updates.profit_share_notes = notes;
      }
    }

    const updatedVenue = await dataStore.updateVenue(venue_id, updates);
    if (!updatedVenue) {
      return NextResponse.json(
        { error: 'Gagal memperbarui status settlement pada database.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      venue: updatedVenue,
      message: `Status ${type} berhasil diperbarui menjadi ${status}.`,
    });
  } catch (error: any) {
    console.error('Settlement PATCH API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan saat memproses settlement payout.' },
      { status: 500 }
    );
  }
}
