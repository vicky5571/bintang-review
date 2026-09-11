import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';

// GET: Returns only public presentation info (name, logo) without sensitive data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug diperlukan' },
        { status: 400 }
      );
    }

    const venue = await dataStore.getVenueBySlug(slug);
    if (!venue || !venue.is_active) {
      return NextResponse.json(
        { error: 'Venue tidak ditemukan atau tidak aktif' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: venue.name,
      logo_url: venue.logo_url,
    });
  } catch (error) {
    console.error('Portal public info error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server internal' },
      { status: 500 }
    );
  }
}

// POST: Securely verifies PIN on server and returns authorized analytics/feedbacks
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, pin } = body;

    if (!slug || typeof pin !== 'string') {
      return NextResponse.json(
        { error: 'Slug dan PIN diperlukan' },
        { status: 400 }
      );
    }

    const venue = await dataStore.getVenueBySlug(slug);
    if (!venue || !venue.is_active) {
      return NextResponse.json(
        { error: 'Venue tidak ditemukan atau tidak aktif' },
        { status: 404 }
      );
    }

    // Verify PIN securely on the server
    if (venue.owner_access_pin.trim() !== pin.trim()) {
      return NextResponse.json(
        { error: 'PIN salah, silakan coba lagi' },
        { status: 401 }
      );
    }

    // Fetch authorized owner data only after successful authentication
    const [analytics, feedbacks] = await Promise.all([
      dataStore.getVenueAnalytics(venue.id),
      dataStore.listFeedback(venue.id),
    ]);

    // Strip sensitive fields (owner_access_pin) from response payload
    const { owner_access_pin: _, ...sanitizedVenue } = venue;

    return NextResponse.json({
      success: true,
      venue: sanitizedVenue,
      analytics,
      feedbacks,
    });
  } catch (error) {
    console.error('Portal verify error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server internal' },
      { status: 500 }
    );
  }
}
