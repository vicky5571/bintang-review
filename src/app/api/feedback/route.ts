import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { venueId, customerName, customerContact, tableNumber, rating, message } = body;

    if (!venueId || !rating || !message) {
      return NextResponse.json({ error: 'venueId, rating, and message are required' }, { status: 400 });
    }

    const saved = await dataStore.saveFeedback({
      venue_id: venueId,
      customer_name: customerName,
      customer_contact: customerContact,
      table_number: tableNumber,
      rating,
      message,
    });

    return NextResponse.json({ success: true, feedback: saved });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
