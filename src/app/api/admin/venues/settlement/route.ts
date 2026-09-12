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
    const { venue_id, bearer_id, type, status, notes } = body;

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
      hpp_marketing_amount: venue.hpp_marketing_amount,
      hpp_bearers: venue.hpp_bearers,
      closing_specialist_id: venue.sales_id || venue.marketing_id,
      transport_fee: venue.transport_fee,
    });

    // If venue has hpp_bearers, update the bearer(s)
    if (venue.hpp_bearers && Array.isArray(venue.hpp_bearers) && venue.hpp_bearers.length > 0) {
      const updatedBearers = venue.hpp_bearers.map((b) => {
        if (b.type !== 'marketing') return b;
        if (bearer_id && b.id !== bearer_id) return b;

        const updated = { ...b };
        if (type === 'hpp_reimburse' || type === 'both') {
          updated.reimburse_status = status;
          updated.reimburse_paid_at = status === 'paid' ? now : null;
          if (notes !== undefined) updated.reimburse_notes = notes;
        }
        if (type === 'profit_share' || type === 'both') {
          updated.profit_share_status = status;
          updated.profit_share_paid_at = status === 'paid' ? now : null;
          if (notes !== undefined) updated.profit_share_notes = notes;
        }
        return updated;
      });

      updates.hpp_bearers = updatedBearers;

      const marketingBearers = updatedBearers.filter((b) => b.type === 'marketing');
      const allReimbursed = marketingBearers.length > 0 &&
        marketingBearers.every((b) => b.reimburse_status === 'paid' || b.amount === 0);
      const allProfitPaid = marketingBearers.length > 0 &&
        marketingBearers.every((b) => b.profit_share_status === 'paid');

      if (dist.reimburse_marketing === 0) {
        updates.hpp_reimburse_status = 'not_applicable';
        updates.hpp_reimburse_paid_at = null;
      } else {
        updates.hpp_reimburse_status = allReimbursed ? 'paid' : 'unpaid';
        updates.hpp_reimburse_paid_at = allReimbursed ? now : null;
      }

      updates.profit_share_status = allProfitPaid ? 'paid' : 'unpaid';
      updates.profit_share_paid_at = allProfitPaid ? now : null;

      if (notes !== undefined) {
        if (type === 'hpp_reimburse' || type === 'both') updates.hpp_reimburse_notes = notes;
        if (type === 'profit_share' || type === 'both') updates.profit_share_notes = notes;
      }
    } else {
      // Legacy single-bearer update
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
