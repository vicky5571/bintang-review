import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { venueId, actionTaken, ratingSelected, deviceType } = body;

    if (!venueId || !actionTaken) {
      return NextResponse.json({ error: 'venueId and actionTaken are required' }, { status: 400 });
    }

    const log = await dataStore.logScan({
      venue_id: venueId,
      action_taken: actionTaken,
      rating_selected: ratingSelected,
      device_type: deviceType || 'Unknown',
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
