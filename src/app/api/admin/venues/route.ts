import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';

export async function GET() {
  try {
    const venues = await dataStore.listVenues();
    return NextResponse.json({ success: true, venues });
  } catch (error) {
    console.error('List venues API error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data venues' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      slug,
      google_review_url,
      redirect_mode,
      feedback_channels,
      whatsapp_number,
      owner_access_pin,
      is_active,
      sales_id,
      deal_amount,
      billing_type,
      monthly_retainer_fee,
    } = body;

    if (!name || !slug || !google_review_url || !owner_access_pin) {
      return NextResponse.json(
        { error: 'Nama, slug, Google review URL, dan PIN owner wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanBillingType = billing_type || (monthly_retainer_fee === 0 ? 'one_time' : 'subscription');
    const cleanRetainer = cleanBillingType === 'one_time' ? 0 : Number(monthly_retainer_fee || 0);

    const payload: any = {
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
      google_review_url: google_review_url.trim(),
      redirect_mode: redirect_mode || 'smart_funnel',
      feedback_channels: feedback_channels || 'whatsapp',
      whatsapp_number: whatsapp_number?.trim() || undefined,
      owner_access_pin: owner_access_pin.trim(),
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      sales_id: sales_id && sales_id.trim() !== '' ? sales_id.trim() : null,
      deal_amount: Number(deal_amount) || 0,
      billing_type: cleanBillingType,
      monthly_retainer_fee: cleanRetainer,
      deal_date: new Date().toISOString().split('T')[0],
    };

    let result;
    if (id) {
      result = await dataStore.updateVenue(id, payload);
    } else {
      result = await dataStore.createVenue(payload);
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Gagal memproses data venue di basis data.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, venue: result });
  } catch (error: any) {
    console.error('Save venue API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Terjadi kesalahan pada server saat menyimpan venue.' },
      { status: 500 }
    );
  }
}
