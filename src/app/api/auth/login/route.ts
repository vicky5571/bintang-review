import { NextResponse } from 'next/server';
import { adminAuthLimiter, getClientIp } from '@/lib/rateLimit';
import { dataStore } from '@/lib/store';

const DEFAULT_ADMIN_PASS = 'bintang2026';
const SESSION_COOKIE_NAME = 'auth_session';
const ADMIN_LEGACY_COOKIE = 'admin_session';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limitStatus = adminAuthLimiter.check(ip);

    if (!limitStatus.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan gagal. Akses login diblokir sementara. Silakan coba lagi dalam ${Math.ceil(
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

    const body = await request.json().catch(() => ({}));
    const { role, password, identifier, pin } = body;

    // 1. Super Admin Authentication
    if (role === 'super_admin') {
      const requiredPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASS;
      if (!password || password.trim() !== requiredPassword.trim()) {
        adminAuthLimiter.recordFailure(ip);
        const remaining = adminAuthLimiter.check(ip).remaining;
        return NextResponse.json(
          {
            error:
              remaining > 0
                ? `Kata sandi Super Admin salah. Sisa ${remaining} percobaan.`
                : 'Kata sandi salah. Akses diblokir sementara karena terlalu banyak percobaan salah.',
          },
          { status: 401 }
        );
      }

      adminAuthLimiter.reset(ip);
      const sessionData = {
        authenticated: true,
        role: 'super_admin',
        name: 'Super Admin',
      };

      const response = NextResponse.json({
        success: true,
        user: sessionData,
      });

      const sessionValue = Buffer.from(JSON.stringify(sessionData)).toString('base64');
      response.headers.append(
        'Set-Cookie',
        `${SESSION_COOKIE_NAME}=${sessionValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
      );
      response.headers.append(
        'Set-Cookie',
        `${ADMIN_LEGACY_COOKIE}=valid_admin_token; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
      );

      return response;
    }

    // 2. Marketing Specialist Authentication
    if (role === 'marketing_specialist') {
      if (!identifier || !pin) {
        return NextResponse.json(
          { error: 'Nomor WhatsApp / Email dan PIN akses wajib diisi.' },
          { status: 400 }
        );
      }

      const specialist = await dataStore.getMarketingSpecialistByCredentials(
        identifier.trim(),
        pin.trim()
      );

      if (!specialist) {
        adminAuthLimiter.recordFailure(ip);
        const remaining = adminAuthLimiter.check(ip).remaining;
        return NextResponse.json(
          {
            error:
              remaining > 0
                ? `Akun Marketing Specialist tidak ditemukan atau PIN salah. Sisa ${remaining} percobaan.`
                : 'Akses diblokir sementara karena terlalu banyak percobaan salah.',
          },
          { status: 401 }
        );
      }

      adminAuthLimiter.reset(ip);
      const sessionData = {
        authenticated: true,
        role: 'marketing_specialist',
        specialist_id: specialist.id,
        name: specialist.name,
        phone_whatsapp: specialist.phone_whatsapp,
        email: specialist.email,
      };

      const response = NextResponse.json({
        success: true,
        user: sessionData,
      });

      const sessionValue = Buffer.from(JSON.stringify(sessionData)).toString('base64');
      response.headers.append(
        'Set-Cookie',
        `${SESSION_COOKIE_NAME}=${sessionValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
      );

      return response;
    }

    return NextResponse.json(
      { error: 'Peran (role) login tidak valid. Pilih Super Admin atau Marketing Specialist.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Unified login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat proses masuk.' },
      { status: 500 }
    );
  }
}
