import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (session && session.role === 'owner') {
      return NextResponse.json(
        { error: 'Akses ditolak.' },
        { status: 403 }
      );
    }
    const list = await dataStore.listMarketingSpecialists();
    return NextResponse.json({ success: true, marketingSpecialists: list, salesAgents: list });
  } catch (error) {
    console.error('List marketing specialists API error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data Marketing Specialists' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (session && session.role === 'owner') {
      return NextResponse.json(
        { error: 'Akses ditolak.' },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { name, phone_whatsapp, email, access_pin, commission_type, commission_rate, is_active } = body;

    if (!name || !phone_whatsapp) {
      return NextResponse.json(
        { error: 'Nama dan nomor WhatsApp wajib diisi.' },
        { status: 400 }
      );
    }

    const specialist = await dataStore.createMarketingSpecialist({
      name: name.trim(),
      phone_whatsapp: phone_whatsapp.trim(),
      email: email?.trim() || undefined,
      access_pin: access_pin?.trim() || '1234',
      commission_type: commission_type || 'percentage',
      commission_rate: Number(commission_rate) || 20,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    });

    return NextResponse.json({
      success: true,
      marketingSpecialist: specialist,
      salesAgent: specialist,
    });
  } catch (error: any) {
    console.error('Create marketing specialist API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal menyimpan data Marketing Specialist.' },
      { status: 500 }
    );
  }
}
