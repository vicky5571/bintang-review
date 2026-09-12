import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract slug from /r/:slug
  const match = pathname.match(/^\/r\/([^/]+)/);
  if (!match) {
    return NextResponse.next();
  }

  const slug = match[1];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Fallback to Next.js App Router page if Supabase credentials are not configured
  if (
    !supabaseUrl ||
    !supabaseKey ||
    !supabaseUrl.startsWith('http') ||
    supabaseUrl.includes('your-project-id')
  ) {
    return NextResponse.next();
  }

  try {
    // Ultra-fast lightweight fetch to PostgREST at Edge (< 100ms)
    const queryUrl = `${supabaseUrl}/rest/v1/venues?slug=eq.${encodeURIComponent(
      slug
    )}&select=id,redirect_mode,google_review_url,is_active&limit=1`;

    const res = await fetch(queryUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.next();
    }

    const venues = await res.json();
    if (!Array.isArray(venues) || venues.length === 0) {
      return NextResponse.next();
    }

    const venue = venues[0];

    // If venue is in direct_google mode and has a valid review URL, execute sub-150ms 302 redirect
    if (venue.is_active && venue.redirect_mode === 'direct_google' && venue.google_review_url) {
      // Validate redirect destination: Must use secure https: protocol (prevents javascript: or open redirect abuses)
      try {
        const parsed = new URL(venue.google_review_url);
        if (parsed.protocol !== 'https:') {
          return NextResponse.next();
        }
      } catch {
        return NextResponse.next();
      }

      const userAgent = request.headers.get('user-agent') || '';
      const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);

      // Asynchronously log scan without blocking the redirect response
      fetch(`${supabaseUrl}/rest/v1/scan_logs`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          venue_id: venue.id,
          action_taken: 'direct_redirect',
          device_type: isMobile ? 'Mobile' : 'Desktop',
        }),
      }).catch(() => {
        // Suppress logging error so redirect is never disrupted
      });

      return NextResponse.redirect(venue.google_review_url, 302);
    }
  } catch (error) {
    // Gracefully fallback to App Router page
    console.error('Edge Middleware error:', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/r/:slug*'],
};
