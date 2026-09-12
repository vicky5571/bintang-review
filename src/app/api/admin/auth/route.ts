import { NextResponse } from 'next/server';
import { adminAuthLimiter, getClientIp } from '@/lib/rateLimit';
import { getSessionFromRequest, SESSION_COOKIE_NAME as UNIFIED_COOKIE_NAME } from '@/lib/auth';

const DEFAULT_ADMIN_PASS = 'bintang2026';
const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_TOKEN = 'valid_admin_token';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (session && session.authenticated) {
    return NextResponse.json({
      authenticated: true,
      role: session.role || 'super_admin',
      name: session.name || 'Super Admin',
      user: session,
    });
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim().split('='))
      .filter((parts) => parts.length === 2)
  );

  const isAuthenticated = cookies[SESSION_COOKIE_NAME] === SESSION_TOKEN;
  return NextResponse.json({
    authenticated: isAuthenticated,
    role: isAuthenticated ? 'super_admin' : undefined,
    user: isAuthenticated ? { authenticated: true, role: 'super_admin', name: 'Super Admin' } : undefined,
  });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  response.headers.append(
    'Set-Cookie',
    `${UNIFIED_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return response;
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const isLogout = searchParams.get('action') === 'logout' || body.action === 'logout';

    if (isLogout) {
      return DELETE();
    }

    // Rate limiting: Anti-brute force against master admin password
    const ip = getClientIp(request);
    const limitStatus = adminAuthLimiter.check(ip);

    if (!limitStatus.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan gagal. Akses login admin diblokir sementara. Silakan coba lagi dalam ${Math.ceil(
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

    const { password } = body;
    const requiredPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASS;

    if (!password || password.trim() !== requiredPassword.trim()) {
      adminAuthLimiter.recordFailure(ip);
      const remaining = adminAuthLimiter.check(ip).remaining;

      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Password salah. Sisa ${remaining} percobaan lagi.`
              : 'Password salah. Akses diblokir sementara karena terlalu banyak percobaan salah.',
        },
        { status: 401 }
      );
    }

    // Success: Reset rate limiter counter for this IP
    adminAuthLimiter.reset(ip);

    const sessionData = {
      authenticated: true,
      role: 'super_admin' as const,
      name: 'Super Admin',
    };
    const sessionValue = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    const response = NextResponse.json({
      success: true,
      user: sessionData,
      role: 'super_admin',
    });

    // Set HTTP-only session cookies for 24 hours
    response.headers.append(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=${SESSION_TOKEN}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );
    response.headers.append(
      'Set-Cookie',
      `${UNIFIED_COOKIE_NAME}=${sessionValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );

    return response;
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server internal' },
      { status: 500 }
    );
  }
}
