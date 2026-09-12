import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { venueId, amount, paymentMethod, senderName, proofUrl, notes } = body;

    if (!venueId || !paymentMethod || !senderName) {
      return NextResponse.json(
        { error: 'venueId, paymentMethod, dan senderName wajib diisi' },
        { status: 400 }
      );
    }

    const confirmation = await dataStore.submitPaymentConfirmation({
      venue_id: venueId,
      amount: Number(amount) || 49000,
      payment_method: String(paymentMethod).trim(),
      sender_name: String(senderName).trim(),
      proof_url: proofUrl ? String(proofUrl).trim() : undefined,
      notes: notes ? String(notes).trim().slice(0, 500) : undefined,
    });

    return NextResponse.json({ success: true, confirmation });
  } catch (error) {
    console.error('Payment confirm error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server internal' },
      { status: 500 }
    );
  }
}
