import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/store';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    let specialistFilter: string | undefined = undefined;

    const { searchParams } = new URL(request.url);
    const querySpecialist = searchParams.get('marketing_id') || searchParams.get('sales_id');

    // If logged in as marketing specialist, strictly enforce scoping to their own venues
    if (session && session.role === 'marketing_specialist' && session.specialist_id) {
      specialistFilter = session.specialist_id;
    } else if (querySpecialist) {
      specialistFilter = querySpecialist;
    }

    const venues = await dataStore.listVenues(specialistFilter);
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
    const session = getSessionFromRequest(request);
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
      marketing_id,
      sales_id,
      deal_amount,
      selling_price,
      hpp,
      hpp_payer,
      hpp_marketing_ratio,
      hpp_marketing_amount,
      hpp_bearers,
      transport_fee,
      billing_type,
      monthly_retainer_fee,
      deal_date,
    } = body;

    if (!name || !slug || !owner_access_pin) {
      return NextResponse.json(
        { error: 'Nama, slug, dan PIN owner wajib diisi.' },
        { status: 400 }
      );
    }

    // Determine marketing specialist attribution
    let assignedSpecialistId: string | null = null;
    if (session && session.role === 'marketing_specialist' && session.specialist_id) {
      // Marketing specialist can only create venues attributed to themselves
      assignedSpecialistId = session.specialist_id;
    } else {
      const candidate = marketing_id || sales_id;
      assignedSpecialistId = candidate && candidate.trim() !== '' ? candidate.trim() : null;
    }

    const cleanBillingType = billing_type || (monthly_retainer_fee === 0 ? 'one_time' : 'subscription');
    const cleanRetainer = cleanBillingType === 'one_time' ? 0 : Number(monthly_retainer_fee || 0);
    const cleanDealAmount = Number(selling_price !== undefined ? selling_price : deal_amount) || 0;
    const cleanHpp = hpp !== undefined ? Number(hpp) : 150000;
    let cleanHppPayer = ['marketing', 'platform', 'split'].includes(hpp_payer) ? hpp_payer : 'marketing';

    let cleanHppBearers: any[] = [];
    let cleanHppMarketingAmount: number | undefined = undefined;
    let cleanHppMarketingRatio: number = 100;

    if (hpp_bearers && Array.isArray(hpp_bearers) && hpp_bearers.length > 0) {
      cleanHppBearers = hpp_bearers.map((b: any, idx: number) => {
        const amt = Math.max(0, Number(b.amount) || 0);
        const r = cleanHpp > 0 ? (amt / cleanHpp) * 100 : 0;
        const bType = b.type === 'platform' ? 'platform' : 'marketing';
        return {
          id: b.id || `bearer-${idx}-${Date.now()}`,
          type: bType,
          specialist_id: bType === 'marketing' ? (b.specialist_id || null) : null,
          name: b.name || (bType === 'platform' ? 'Platform / Agency (Kas Perusahaan)' : 'Marketing Specialist'),
          amount: amt,
          ratio: r,
          reimburse_status: b.reimburse_status || 'unpaid',
          reimburse_paid_at: b.reimburse_paid_at || null,
          reimburse_notes: b.reimburse_notes || null,
          profit_share_status: b.profit_share_status || 'unpaid',
          profit_share_paid_at: b.profit_share_paid_at || null,
          profit_share_notes: b.profit_share_notes || null,
        };
      });

      const marketingSum = cleanHppBearers
        .filter((b) => b.type === 'marketing')
        .reduce((sum, b) => sum + b.amount, 0);

      cleanHppMarketingAmount = marketingSum;
      cleanHppMarketingRatio = cleanHpp > 0 ? (marketingSum / cleanHpp) * 100 : 100;

      if (marketingSum === cleanHpp) cleanHppPayer = 'marketing';
      else if (marketingSum === 0) cleanHppPayer = 'platform';
      else cleanHppPayer = 'split';
    } else if (hpp_marketing_amount !== undefined && hpp_marketing_amount !== null && !isNaN(Number(hpp_marketing_amount))) {
      cleanHppMarketingAmount = Math.min(cleanHpp, Math.max(0, Number(hpp_marketing_amount)));
      cleanHppMarketingRatio = cleanHpp > 0 ? (cleanHppMarketingAmount / cleanHpp) * 100 : 100;
    } else if (hpp_marketing_ratio !== undefined) {
      cleanHppMarketingRatio = Math.min(100, Math.max(0, Number(hpp_marketing_ratio)));
      cleanHppMarketingAmount = Math.round((cleanHpp * cleanHppMarketingRatio) / 100);
    } else {
      cleanHppMarketingRatio = cleanHppPayer === 'platform' ? 0 : (cleanHppPayer === 'split' ? 50 : 100);
      cleanHppMarketingAmount = Math.round((cleanHpp * cleanHppMarketingRatio) / 100);
    }

    const cleanTransportFee = transport_fee !== undefined ? Math.max(0, Number(transport_fee)) : 20000;

    const cleanGoogleUrl = (google_review_url || '').trim();
    const isActive = cleanGoogleUrl.length > 0;

    const payload: any = {
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
      google_review_url: cleanGoogleUrl,
      redirect_mode: redirect_mode || 'smart_funnel',
      feedback_channels: feedback_channels || 'whatsapp',
      whatsapp_number: whatsapp_number?.trim() || undefined,
      owner_access_pin: owner_access_pin.trim(),
      is_active: isActive,
      sales_id: assignedSpecialistId,
      marketing_id: assignedSpecialistId,
      deal_amount: cleanDealAmount,
      hpp: cleanHpp,
      hpp_payer: cleanHppPayer,
      hpp_marketing_ratio: cleanHppMarketingRatio,
      hpp_marketing_amount: cleanHppMarketingAmount,
      hpp_bearers: cleanHppBearers,
      transport_fee: cleanTransportFee,
      billing_type: cleanBillingType,
      monthly_retainer_fee: cleanRetainer,
    };

    if (deal_date) {
      payload.deal_date = deal_date;
    } else if (!id) {
      payload.deal_date = new Date().toISOString().split('T')[0];
    }

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
