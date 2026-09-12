import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';
import { portalPinLimiter, getClientIp } from '@/lib/rateLimit';
import { getSessionFromRequest, SESSION_COOKIE_NAME } from '@/lib/auth';

// GET: Returns public info or full data if owner is already logged in
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

    // Check if user already has an active authenticated session for this venue
    const session = getSessionFromRequest(request);
    const isAuthorized = session?.authenticated && (
      session.role === 'super_admin' ||
      (session.role === 'owner' && (session.venue_slug === venue.slug || session.venue_id === venue.id))
    );

    if (isAuthorized) {
      const [analytics, feedbacks] = await Promise.all([
        dataStore.getVenueAnalytics(venue.id),
        dataStore.listFeedback(venue.id),
      ]);
      const { owner_access_pin: _, ...sanitizedVenue } = venue;
      return NextResponse.json({
        name: venue.name,
        logo_url: venue.logo_url,
        authenticated: true,
        venue: sanitizedVenue,
        analytics,
        feedbacks,
      });
    }

    return NextResponse.json({
      name: venue.name,
      logo_url: venue.logo_url,
      authenticated: false,
    });
  } catch (error) {
    console.error('Portal public info error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server internal' },
      { status: 500 }
    );
  }
}

// POST: Securely verifies PIN on server with Rate Limiting protection
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

    // Rate limiting: Anti brute-force by client IP + venue slug
    const ip = getClientIp(request);
    const rateLimitKey = `${ip}:${slug}`;
    const limitStatus = portalPinLimiter.check(rateLimitKey);

    if (!limitStatus.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan salah. Akses diblokir sementara. Silakan coba lagi dalam ${Math.ceil(
            limitStatus.retryAfter / 60
          )} menit.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(limitStatus.retryAfter),
          },
        }
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
      portalPinLimiter.recordFailure(rateLimitKey);
      const remaining = portalPinLimiter.check(rateLimitKey).remaining;

      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `PIN salah. Sisa ${remaining} percobaan lagi.`
              : 'PIN salah. Akses diblokir sementara karena terlalu banyak percobaan.',
        },
        { status: 401 }
      );
    }

    // Success: Reset rate limiter counter for this venue
    portalPinLimiter.reset(rateLimitKey);

    // Fetch authorized owner data only after successful authentication
    const [analytics, feedbacks] = await Promise.all([
      dataStore.getVenueAnalytics(venue.id),
      dataStore.listFeedback(venue.id),
    ]);

    // Strip sensitive fields (owner_access_pin) from response payload
    const { owner_access_pin: _, ...sanitizedVenue } = venue;

    const sessionData = {
      authenticated: true,
      role: 'owner',
      venue_id: venue.id,
      venue_slug: venue.slug,
      name: venue.name,
      phone_whatsapp: venue.whatsapp_number,
      email: venue.feedback_email,
    };
    const sessionValue = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    const response = NextResponse.json({
      success: true,
      venue: sanitizedVenue,
      analytics,
      feedbacks,
    });

    response.headers.append(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=${sessionValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );

    return response;
  } catch (error) {
    console.error('Portal verify error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server internal' },
      { status: 500 }
    );
  }
}
