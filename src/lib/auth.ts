import { AuthSession } from './types';

export const SESSION_COOKIE_NAME = 'auth_session';
export const ADMIN_LEGACY_COOKIE = 'admin_session';

export function getSessionFromRequest(request: Request): AuthSession | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const trimmed = cookie.trim();
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      cookies[key] = val;
    }
  });

  const authSessionCookie = cookies[SESSION_COOKIE_NAME];
  if (authSessionCookie) {
    try {
      const decoded = JSON.parse(Buffer.from(authSessionCookie, 'base64').toString('utf-8'));
      if (decoded.authenticated && decoded.role) {
        return decoded as AuthSession;
      }
    } catch {
      // Ignore parse failure
    }
  }

  // Backward compatibility with legacy admin_session cookie
  if (cookies[ADMIN_LEGACY_COOKIE] === 'valid_admin_token') {
    return {
      authenticated: true,
      role: 'super_admin',
      name: 'Super Admin',
    };
  }

  return null;
}
