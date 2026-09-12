import { NextResponse } from 'next/server';
import { getSessionFromRequest, SESSION_COOKIE_NAME, ADMIN_LEGACY_COOKIE } from '@/lib/auth';

export async function GET(request: Request) {
  const session = getSessionFromRequest(request);
  if (session && session.authenticated) {
    return NextResponse.json({ authenticated: true, user: session });
  }

  return NextResponse.json({ authenticated: false });
}

export async function POST(request: Request) {
  const response = NextResponse.json({ success: true, message: 'Berhasil keluar.' });
  response.headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  response.headers.append(
    'Set-Cookie',
    `${ADMIN_LEGACY_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return response;
}
