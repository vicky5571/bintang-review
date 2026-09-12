import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';

export async function GET() {
  try {
    const list = await dataStore.listPaymentConfirmations();
    return NextResponse.json({ success: true, payments: list });
  } catch (error) {
    console.error('List payments error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data pembayaran' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'ID dan status (approved/rejected) diperlukan' },
        { status: 400 }
      );
    }

    const verified = await dataStore.verifyPaymentConfirmation(id, status, notes);
    if (!verified) {
      return NextResponse.json(
        { error: 'Konfirmasi pembayaran tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, payment: verified });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: 'Gagal memverifikasi pembayaran' },
      { status: 500 }
    );
  }
}
