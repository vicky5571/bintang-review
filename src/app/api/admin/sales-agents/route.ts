import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';

export async function GET() {
  try {
    const list = await dataStore.listSalesAgents();
    return NextResponse.json({ success: true, salesAgents: list });
  } catch (error) {
    console.error('List sales agents API error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data sales agents' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone_whatsapp, email, commission_type, commission_rate, is_active } = body;

    if (!name || !phone_whatsapp) {
      return NextResponse.json(
        { error: 'Nama dan nomor WhatsApp wajib diisi.' },
        { status: 400 }
      );
    }

    const agent = await dataStore.createSalesAgent({
      name: name.trim(),
      phone_whatsapp: phone_whatsapp.trim(),
      email: email?.trim() || undefined,
      commission_type: commission_type || 'percentage',
      commission_rate: Number(commission_rate) || 20,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    });

    return NextResponse.json({ success: true, salesAgent: agent });
  } catch (error: any) {
    console.error('Create sales agent API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal menyimpan data sales agent.' },
      { status: 500 }
    );
  }
}
