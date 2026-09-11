import { NextResponse } from 'next/server';

const DEFAULT_ADMIN_PASS = 'bintang2026';
const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_TOKEN = 'valid_admin_token';

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim().split('='))
      .filter((parts) => parts.length === 2)
  );

  const isAuthenticated = cookies[SESSION_COOKIE_NAME] === SESSION_TOKEN;
  return NextResponse.json({ authenticated: isAuthenticated });
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const isLogout = searchParams.get('action') === 'logout' || body.action === 'logout';

    if (isLogout) {
      const response = NextResponse.json({ success: true });
      response.headers.set(
        'Set-Cookie',
        `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
      );
      return response;
    }

    const { password } = body;
    const requiredPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASS;

    if (!password || password.trim() !== requiredPassword.trim()) {
      return NextResponse.json(
        { error: 'Password salah, silakan coba lagi' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    // Set HTTP-only session cookie for 24 hours
    response.headers.set(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=${SESSION_TOKEN}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
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
