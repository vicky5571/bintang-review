'use client';

import React, { useState, useEffect } from 'react';
import { Venue, MarketingSpecialistSummary, RedirectMode, FeedbackChannel, BillingType, UserRole, HppPayerType, HppBearer } from '@/lib/types';
import { calculateProfitDistribution } from '@/lib/profitSharing';
import { X, Save, Plus, ShieldCheck, Sparkles, UserCheck, DollarSign, Car, Building2, Briefcase, Percent, Trash2, PlusCircle, CheckCircle2, AlertTriangle, Users, Info, RefreshCw, Gem, Scale, Loader2, Zap, TrendingUp } from 'lucide-react';
import { CurrencyInput } from '@/components/CurrencyInput';

interface AdminVenueModalProps {
  venue: Venue | null;
  isOpen: boolean;
  marketingSpecialists: MarketingSpecialistSummary[];
  currentRole?: UserRole;
  currentSpecialistId?: string;
  onClose: () => void;
  onSave: (data: Partial<Venue>) => Promise<void> | void;
}

export function AdminVenueModal({
  venue,
  isOpen,
  marketingSpecialists,
  currentRole,
  currentSpecialistId,
  onClose,
  onSave,
}: AdminVenueModalProps) {
  const isMarketingSpecialistRole = currentRole === 'marketing_specialist';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    google_review_url: string;
    redirect_mode: RedirectMode;
    feedback_channels: FeedbackChannel;
    whatsapp_number: string;
    owner_access_pin: string;
    marketing_id: string;
    deal_amount: number;
    hpp: number;
    hpp_payer: HppPayerType;
    hpp_marketing_ratio: number;
    hpp_marketing_amount?: number;
    hpp_bearers: HppBearer[];
    transport_fee: number;
    billing_type: BillingType;
    monthly_retainer_fee: number;
  }>({
    name: '',
    slug: '',
    google_review_url: '',
    redirect_mode: 'smart_funnel',
    feedback_channels: 'whatsapp',
    whatsapp_number: '',
    owner_access_pin: '1234',
    marketing_id: '',
    deal_amount: 599000,
    hpp: 150000,
    hpp_payer: 'marketing',
    hpp_marketing_ratio: 100,
    hpp_marketing_amount: 150000,
    hpp_bearers: [],
    transport_fee: 20000,
    billing_type: 'subscription',
    monthly_retainer_fee: 149000,
  });

  const createDefaultSplitBearers = (hppVal: number, initialSpecialistId?: string): HppBearer[] => {
    const primarySpec = marketingSpecialists.find((m) => m.id === initialSpecialistId) || marketingSpecialists[0];
    const half1 = Math.round(hppVal * 0.5);
    const half2 = hppVal - half1;

    return [
      {
        id: `bearer-1-${Date.now()}`,
        type: primarySpec ? 'marketing' : 'platform',
        specialist_id: primarySpec ? primarySpec.id : null,
        name: primarySpec ? primarySpec.name : 'Marketing Specialist',
        amount: half1,
        ratio: hppVal > 0 ? (half1 / hppVal) * 100 : 50,
        reimburse_status: 'unpaid',
        profit_share_status: 'unpaid',
      },
      {
        id: `bearer-2-${Date.now() + 1}`,
        type: 'platform',
        specialist_id: null,
        name: 'Platform / Agency (Kas Perusahaan)',
        amount: half2,
        ratio: hppVal > 0 ? (half2 / hppVal) * 100 : 50,
        reimburse_status: 'unpaid',
        profit_share_status: 'unpaid',
      },
    ];
  };

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setIsSubmitting(false);

    const defaultMarketingId = isMarketingSpecialistRole
      ? (currentSpecialistId || '')
      : (marketingSpecialists[0]?.id || '');

    if (venue) {
      const isOneTime = venue.billing_type === 'one_time' || venue.monthly_retainer_fee === 0;
      const hppVal = venue.hpp !== undefined && venue.hpp !== null ? Number(venue.hpp) : 150000;
      const payer = venue.hpp_payer || 'marketing';

      let initialBearers: HppBearer[] = [];
      if (venue.hpp_bearers && Array.isArray(venue.hpp_bearers) && venue.hpp_bearers.length > 0) {
        initialBearers = venue.hpp_bearers.map((b) => ({ ...b }));
      } else if (payer === 'split') {
        const mAmount = venue.hpp_marketing_amount !== undefined && venue.hpp_marketing_amount !== null
          ? Number(venue.hpp_marketing_amount)
          : Math.round((hppVal * (venue.hpp_marketing_ratio || 50)) / 100);
        const pAmount = Math.max(0, hppVal - mAmount);
        const specObj = marketingSpecialists.find((m) => m.id === (venue.marketing_id || venue.sales_id));

        initialBearers = [
          {
            id: 'bearer-1',
            type: 'marketing',
            specialist_id: venue.marketing_id || venue.sales_id || defaultMarketingId,
            name: specObj?.name || 'Marketing Specialist',
            amount: mAmount,
            ratio: hppVal > 0 ? (mAmount / hppVal) * 100 : 50,
            reimburse_status: 'unpaid',
            profit_share_status: 'unpaid',
          },
          {
            id: 'bearer-2',
            type: 'platform',
            specialist_id: null,
            name: 'Platform / Agency (Kas Perusahaan)',
            amount: pAmount,
            ratio: hppVal > 0 ? (pAmount / hppVal) * 100 : 50,
            reimburse_status: 'unpaid',
            profit_share_status: 'unpaid',
          },
        ];
      } else if (payer === 'platform') {
        initialBearers = [
          {
            id: 'bearer-platform',
            type: 'platform',
            specialist_id: null,
            name: 'Platform / Agency (Kas Perusahaan)',
            amount: hppVal,
            ratio: 100,
            reimburse_status: 'unpaid',
            profit_share_status: 'unpaid',
          },
        ];
      } else {
        const specObj = marketingSpecialists.find((m) => m.id === (venue.marketing_id || venue.sales_id));
        initialBearers = [
          {
            id: 'bearer-marketing',
            type: 'marketing',
            specialist_id: venue.marketing_id || venue.sales_id || defaultMarketingId,
            name: specObj?.name || 'Marketing Specialist',
            amount: hppVal,
            ratio: 100,
            reimburse_status: 'unpaid',
            profit_share_status: 'unpaid',
          },
        ];
      }

      setFormData({
        name: venue.name,
        slug: venue.slug,
        google_review_url: venue.google_review_url || '',
        redirect_mode: venue.redirect_mode,
        feedback_channels: venue.feedback_channels,
        whatsapp_number: venue.whatsapp_number || '',
        owner_access_pin: venue.owner_access_pin,
        marketing_id: isMarketingSpecialistRole ? (currentSpecialistId || '') : (venue.marketing_id || venue.sales_id || ''),
        deal_amount: venue.deal_amount !== undefined ? Number(venue.deal_amount) : 599000,
        hpp: hppVal,
        hpp_payer: payer,
        hpp_marketing_ratio: venue.hpp_marketing_ratio !== undefined ? Number(venue.hpp_marketing_ratio) : 100,
        hpp_marketing_amount: venue.hpp_marketing_amount !== undefined && venue.hpp_marketing_amount !== null
          ? Number(venue.hpp_marketing_amount)
          : Math.round((hppVal * (venue.hpp_marketing_ratio !== undefined ? Number(venue.hpp_marketing_ratio) : 100)) / 100),
        hpp_bearers: initialBearers,
        transport_fee: venue.transport_fee !== undefined ? Number(venue.transport_fee) : 20000,
        billing_type: isOneTime ? 'one_time' : 'subscription',
        monthly_retainer_fee: isOneTime ? 0 : (venue.monthly_retainer_fee || 149000),
      });
    } else {
      const initialHpp = 150000;
      const specObj = marketingSpecialists.find((m) => m.id === defaultMarketingId);
      setFormData({
        name: '',
        slug: '',
        google_review_url: '',
        redirect_mode: 'smart_funnel',
        feedback_channels: 'whatsapp',
        whatsapp_number: '',
        owner_access_pin: '1234',
        marketing_id: defaultMarketingId,
        deal_amount: 599000,
        hpp: initialHpp,
        hpp_payer: 'marketing',
        hpp_marketing_ratio: 100,
        hpp_marketing_amount: initialHpp,
        hpp_bearers: [
          {
            id: 'bearer-marketing',
            type: 'marketing',
            specialist_id: defaultMarketingId,
            name: specObj?.name || 'Marketing Specialist',
            amount: initialHpp,
            ratio: 100,
            reimburse_status: 'unpaid',
            profit_share_status: 'unpaid',
          },
        ],
        transport_fee: 20000,
        billing_type: 'subscription',
        monthly_retainer_fee: 149000,
      });
    }
  }, [isOpen, venue, marketingSpecialists, isMarketingSpecialistRole, currentSpecialistId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      let cleanReviewUrl = (formData.google_review_url || '').trim();
      if (cleanReviewUrl && !/^https?:\/\//i.test(cleanReviewUrl)) {
        cleanReviewUrl = `https://${cleanReviewUrl}`;
      }
      const isActive = Boolean(cleanReviewUrl);
      await onSave({
        ...(venue?.id ? { id: venue.id } : {}),
        ...formData,
        google_review_url: cleanReviewUrl,
        is_active: isActive,
        sales_id: formData.marketing_id,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan venue. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSpecialistObj = marketingSpecialists.find((m) => m.id === (currentSpecialistId || formData.marketing_id));

  const totalAllocated = (formData.hpp_bearers || []).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const handleHppChange = (rawHpp: number) => {
    const newHpp = Math.max(0, Number(rawHpp) || 0);
    if (formData.hpp_payer === 'marketing') {
      const specObj = marketingSpecialists.find((m) => m.id === formData.marketing_id);
      setFormData({
        ...formData,
        hpp: newHpp,
        hpp_marketing_amount: newHpp,
        hpp_marketing_ratio: 100,
        hpp_bearers: [
          {
            id: 'bearer-marketing',
            type: 'marketing',
            specialist_id: formData.marketing_id,
            name: specObj?.name || 'Marketing Specialist',
            amount: newHpp,
            ratio: 100,
            reimburse_status: 'unpaid',
            profit_share_status: 'unpaid',
          },
        ],
      });
    } else if (formData.hpp_payer === 'platform') {
      setFormData({
        ...formData,
        hpp: newHpp,
        hpp_marketing_amount: 0,
        hpp_marketing_ratio: 0,
        hpp_bearers: [
          {
            id: 'bearer-platform',
            type: 'platform',
            specialist_id: null,
            name: 'Platform / Agency (Kas Perusahaan)',
            amount: newHpp,
            ratio: 100,
            reimburse_status: 'unpaid',
            profit_share_status: 'unpaid',
          },
        ],
      });
    } else {
      const current = formData.hpp_bearers || [];
      const count = Math.max(2, current.length);
      const base = Math.floor(newHpp / count);
      const rem = newHpp % count;
      const updated = (current.length >= 2 ? current : createDefaultSplitBearers(newHpp, formData.marketing_id)).map((b, i) => {
        const amt = base + (i < rem ? 1 : 0);
        return { ...b, amount: amt, ratio: newHpp > 0 ? (amt / newHpp) * 100 : 0 };
      });
      const mSum = updated.filter((b) => b.type === 'marketing').reduce((s, b) => s + b.amount, 0);
      setFormData({
        ...formData,
        hpp: newHpp,
        hpp_bearers: updated,
        hpp_marketing_amount: mSum,
        hpp_marketing_ratio: newHpp > 0 ? (mSum / newHpp) * 100 : 0,
      });
    }
  };

  const handleBearerSelectionChange = (index: number, selectedValue: string) => {
    const updated = [...(formData.hpp_bearers || [])];
    if (selectedValue === 'platform') {
      updated[index] = {
        ...updated[index],
        type: 'platform',
        specialist_id: null,
        name: 'Platform / Agency (Kas Perusahaan)',
      };
    } else {
      const spec = marketingSpecialists.find((m) => m.id === selectedValue);
      updated[index] = {
        ...updated[index],
        type: 'marketing',
        specialist_id: spec?.id || selectedValue,
        name: spec?.name || 'Marketing Specialist',
      };
    }

    const marketingSum = updated
      .filter((b) => b.type === 'marketing')
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const mRatio = formData.hpp > 0 ? (marketingSum / formData.hpp) * 100 : 0;

    setFormData({
      ...formData,
      hpp_bearers: updated,
      hpp_marketing_amount: marketingSum,
      hpp_marketing_ratio: mRatio,
    });
  };

  const handleBearerAmountChange = (index: number, rawAmount: number) => {
    const amt = Math.max(0, Number(rawAmount) || 0);
    const updated = [...(formData.hpp_bearers || [])];
    const ratio = formData.hpp > 0 ? (amt / formData.hpp) * 100 : 0;

    updated[index] = {
      ...updated[index],
      amount: amt,
      ratio,
    };

    const marketingSum = updated
      .filter((b) => b.type === 'marketing')
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const mRatio = formData.hpp > 0 ? (marketingSum / formData.hpp) * 100 : 0;

    setFormData({
      ...formData,
      hpp_bearers: updated,
      hpp_marketing_amount: marketingSum,
      hpp_marketing_ratio: mRatio,
    });
  };

  const handleAddBearer = () => {
    const current = formData.hpp_bearers || [];
    const usedSpecIds = new Set(current.filter((b) => b.type === 'marketing').map((b) => b.specialist_id));
    const nextSpec = marketingSpecialists.find((m) => !usedSpecIds.has(m.id));

    const newBearer: HppBearer = {
      id: `bearer-${Date.now()}`,
      type: nextSpec ? 'marketing' : 'platform',
      specialist_id: nextSpec ? nextSpec.id : null,
      name: nextSpec ? nextSpec.name : 'Platform / Agency (Kas Perusahaan)',
      amount: 0,
      ratio: 0,
      reimburse_status: 'unpaid',
      profit_share_status: 'unpaid',
    };

    setFormData({
      ...formData,
      hpp_bearers: [...current, newBearer],
    });
  };

  const handleRemoveBearer = (index: number) => {
    const current = formData.hpp_bearers || [];
    if (current.length <= 2) return;

    const updated = current.filter((_, i) => i !== index);
    const marketingSum = updated
      .filter((b) => b.type === 'marketing')
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const mRatio = formData.hpp > 0 ? (marketingSum / formData.hpp) * 100 : 0;

    setFormData({
      ...formData,
      hpp_bearers: updated,
      hpp_marketing_amount: marketingSum,
      hpp_marketing_ratio: mRatio,
    });
  };

  const handleEvenSplit = () => {
    const current = formData.hpp_bearers || [];
    if (current.length === 0) return;

    const count = current.length;
    const base = Math.floor(formData.hpp / count);
    const remainder = formData.hpp % count;

    const updated = current.map((b, i) => {
      const amt = base + (i < remainder ? 1 : 0);
      const ratio = formData.hpp > 0 ? (amt / formData.hpp) * 100 : 0;
      return { ...b, amount: amt, ratio };
    });

    const marketingSum = updated
      .filter((b) => b.type === 'marketing')
      .reduce((sum, b) => sum + b.amount, 0);
    const mRatio = formData.hpp > 0 ? (marketingSum / formData.hpp) * 100 : 0;

    setFormData({
      ...formData,
      hpp_bearers: updated,
      hpp_marketing_amount: marketingSum,
      hpp_marketing_ratio: mRatio,
    });
  };

  const handleAdjustLastBearer = () => {
    const current = formData.hpp_bearers || [];
    if (current.length === 0) return;

    const sumExceptLast = current.slice(0, -1).reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
    const lastAmt = Math.max(0, formData.hpp - sumExceptLast);
    const lastRatio = formData.hpp > 0 ? (lastAmt / formData.hpp) * 100 : 0;

    const updated = current.map((b, i) => {
      if (i === current.length - 1) {
        return { ...b, amount: lastAmt, ratio: lastRatio };
      }
      return b;
    });

    const marketingSum = updated
      .filter((b) => b.type === 'marketing')
      .reduce((sum, b) => sum + b.amount, 0);
    const mRatio = formData.hpp > 0 ? (marketingSum / formData.hpp) * 100 : 0;

    setFormData({
      ...formData,
      hpp_bearers: updated,
      hpp_marketing_amount: marketingSum,
      hpp_marketing_ratio: mRatio,
    });
  };

  const profitDist = calculateProfitDistribution({
    deal_amount: formData.deal_amount,
    hpp: formData.hpp,
    hpp_payer: formData.hpp_payer,
    hpp_marketing_ratio: formData.hpp_marketing_ratio,
    hpp_marketing_amount: formData.hpp_marketing_amount,
    hpp_bearers: formData.hpp_bearers,
    closing_specialist_id: formData.marketing_id,
    transport_fee: formData.transport_fee,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">
            {venue ? `Edit Venue — ${venue.name}` : 'Tambah Klien / Venue Baru'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {venue && (!venue.google_review_url || venue.google_review_url.trim() === '') && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900 font-medium">
            <Zap className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Aktivasi Stand QR:</span> Masukkan tautan Google Review klien di bawah untuk mengaktifkan stand ini.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600">Nama Venue *</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none"
                placeholder="Kopi Senja"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">Slug URL *</label>
              <input
                required
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none"
                placeholder="kopi-senja"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Google Review Write URL (Tautan Ulasan Google)
              </label>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                !formData.google_review_url ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-100 text-slate-500'
              }`}>
                {!formData.google_review_url ? 'Belum Diaktivasi (Stok)' : 'Telah Terhubung'}
              </span>
            </div>
            <input
              type="text"
              value={formData.google_review_url}
              onChange={(e) => setFormData({ ...formData, google_review_url: e.target.value })}
              className={`mt-1 w-full px-3 py-2 border rounded-xl font-mono text-xs focus:ring-2 focus:ring-lime-500/20 focus:outline-none ${
                !formData.google_review_url && venue
                  ? 'border-amber-400 bg-amber-50/30 focus:border-amber-500'
                  : 'border-slate-200 focus:border-[#84cc16]'
              }`}
              placeholder="https://search.google.com/local/writereview?placeid=... (Kosongkan jika stok belum laku)"
            />
            <div className="flex items-start gap-1.5 text-[10px] text-slate-500 mt-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p>
                <strong>Aktivasi oleh Marketing / Admin:</strong> Masukkan URL Google Review klien di sini untuk mengaktifkan stand ini. Saat membuat stok fisik baru, kolom ini dapat dikosongkan terlebih dahulu dan diaktifkan saat unit terjual.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600">Mode Routing</label>
              <select
                value={formData.redirect_mode}
                onChange={(e) => setFormData({ ...formData, redirect_mode: e.target.value as any })}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none"
              >
                <option value="smart_funnel">Smart Funnel (1-5 Star)</option>
                <option value="direct_google">Direct Google (1-Click Bypass)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">Kanal Masukan Privat</label>
              <select
                value={formData.feedback_channels}
                onChange={(e) => setFormData({ ...formData, feedback_channels: e.target.value as any })}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none"
              >
                <option value="whatsapp">WhatsApp Manager Chat</option>
                <option value="email">Email / Inbox Saja</option>
                <option value="both">Keduanya (WhatsApp + Email)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600">WhatsApp Manager (62...)</label>
              <input
                type="text"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none"
                placeholder="628123456789"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">Owner Access PIN</label>
              <input
                required
                type="text"
                maxLength={6}
                value={formData.owner_access_pin}
                onChange={(e) => setFormData({ ...formData, owner_access_pin: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-center tracking-wider focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none"
                placeholder="1234"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Model Pembayaran Klien</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, billing_type: 'subscription', monthly_retainer_fee: formData.monthly_retainer_fee || 149000 })}
                  className={`p-2.5 rounded-xl border text-left flex flex-col transition ${
                    formData.billing_type === 'subscription'
                      ? 'border-[#00c48c] bg-emerald-50/50 text-slate-900 ring-1 ring-[#00c48c]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    Langganan Bulanan
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Biaya setup + iuran retainer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, billing_type: 'one_time', monthly_retainer_fee: 0 })}
                  className={`p-2.5 rounded-xl border text-left flex flex-col transition ${
                    formData.billing_type === 'one_time'
                      ? 'border-purple-500 bg-purple-50/50 text-slate-900 ring-1 ring-purple-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Gem className="w-3.5 h-3.5 text-purple-600" />
                    Sekali Bayar (Lifetime)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Sekali bayar, aktif selamanya tanpa iuran</span>
                </button>
              </div>
            </div>

            {/* Financials: Harga Jual & HPP Per Transaksi */}
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput
                label="Harga Jual ke Klien (Rp)"
                required
                value={formData.deal_amount}
                onChange={(val) => setFormData({ ...formData, deal_amount: val })}
                placeholder="599.000"
                presets={[399000, 499000, 599000, 799000]}
                showTerbilang
                colorScheme="lime"
                helpText="Nilai total closing deal penjualan stand."
              />

              <CurrencyInput
                label="HPP / Modal Produksi (Rp)"
                required
                value={formData.hpp}
                onChange={handleHppChange}
                placeholder="150.000"
                presets={[100000, 150000, 200000]}
                showTerbilang
                colorScheme="amber"
                helpText="Biaya cetak akrilik, chip NFC & packing unit."
              />
            </div>

            {/* Option 4: Dual Visualizer (Live Profit Margin & Gross Profit Pill) */}
            <div className="p-3 bg-gradient-to-r from-slate-50 via-emerald-50/50 to-slate-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block">
                    Margin Kotor Unit (Gross Profit)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Harga Jual (Rp {formData.deal_amount.toLocaleString('id-ID')}) − HPP (Rp {formData.hpp.toLocaleString('id-ID')})
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-emerald-700 text-sm">
                  Rp {Math.max(0, formData.deal_amount - formData.hpp).toLocaleString('id-ID')}
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    formData.deal_amount > 0 && ((formData.deal_amount - formData.hpp) / formData.deal_amount) >= 0.5
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : formData.deal_amount > 0 && ((formData.deal_amount - formData.hpp) / formData.deal_amount) >= 0.2
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  Margin {formData.deal_amount > 0 ? Math.round(((formData.deal_amount - formData.hpp) / formData.deal_amount) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Skema Penanggung Modal HPP */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Penanggung Modal Awal HPP (Reimburse Pertama)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const specObj = marketingSpecialists.find((m) => m.id === formData.marketing_id);
                    setFormData({
                      ...formData,
                      hpp_payer: 'marketing',
                      hpp_marketing_ratio: 100,
                      hpp_marketing_amount: formData.hpp,
                      hpp_bearers: [
                        {
                          id: 'bearer-marketing',
                          type: 'marketing',
                          specialist_id: formData.marketing_id,
                          name: specObj?.name || 'Marketing Specialist',
                          amount: formData.hpp,
                          ratio: 100,
                          reimburse_status: 'unpaid',
                          profit_share_status: 'unpaid',
                        },
                      ],
                    });
                  }}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    formData.hpp_payer === 'marketing'
                      ? 'border-[#84cc16] bg-lime-50 text-slate-900 ring-1 ring-[#84cc16]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 mb-1 text-[#84cc16]" />
                  <span className="text-[11px] font-bold">Marketing (100%)</span>
                  <span className="text-[9px] text-slate-400">Modal 1 Specialist</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      hpp_payer: 'platform',
                      hpp_marketing_ratio: 0,
                      hpp_marketing_amount: 0,
                      hpp_bearers: [
                        {
                          id: 'bearer-platform',
                          type: 'platform',
                          specialist_id: null,
                          name: 'Platform / Agency (Kas Perusahaan)',
                          amount: formData.hpp,
                          ratio: 100,
                          reimburse_status: 'unpaid',
                          profit_share_status: 'unpaid',
                        },
                      ],
                    })
                  }
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    formData.hpp_payer === 'platform'
                      ? 'border-cyan-500 bg-cyan-50 text-slate-900 ring-1 ring-cyan-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 mb-1 text-cyan-600" />
                  <span className="text-[11px] font-bold">Platform (100%)</span>
                  <span className="text-[9px] text-slate-400">Modal dari Agency</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const current = formData.hpp_bearers && formData.hpp_bearers.length >= 2
                      ? formData.hpp_bearers
                      : createDefaultSplitBearers(formData.hpp, formData.marketing_id);
                    const mSum = current.filter((b) => b.type === 'marketing').reduce((s, b) => s + b.amount, 0);
                    setFormData({
                      ...formData,
                      hpp_payer: 'split',
                      hpp_bearers: current,
                      hpp_marketing_amount: mSum,
                      hpp_marketing_ratio: formData.hpp > 0 ? (mSum / formData.hpp) * 100 : 50,
                    });
                  }}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    formData.hpp_payer === 'split'
                      ? 'border-indigo-500 bg-indigo-50 text-slate-900 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5 mb-1 text-indigo-600" />
                  <span className="text-[11px] font-bold">Split Bersama</span>
                  <span className="text-[9px] text-slate-400">Multi Marketing & Kas</span>
                </button>
              </div>

              {formData.hpp_payer === 'split' && (
                <div className="mt-2.5 p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Penanggung Modal HPP (Multi-Bearer)
                    </span>
                    <span className="text-[11px] text-indigo-700 font-bold bg-indigo-100/70 px-2 py-0.5 rounded-lg">
                      Total HPP: Rp {formData.hpp.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-tight">
                    Pilih penanggung modal (beberapa marketing specialist atau kas platform) melalui dropdown, lalu tentukan nominal Rupiah masing-masing.
                  </p>

                  {/* List of Bearer Rows */}
                  <div className="space-y-2.5">
                    {formData.hpp_bearers.map((bearer, index) => {
                      const percentage = formData.hpp > 0 ? ((bearer.amount / formData.hpp) * 100).toFixed(1) : '0.0';
                      return (
                        <div
                          key={bearer.id || index}
                          className="p-2.5 bg-white border border-indigo-100 rounded-xl shadow-sm space-y-2 hover:border-indigo-200 transition"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                              Penanggung #{index + 1}
                              <span className={`ml-1 text-[9px] font-normal px-1.5 py-0.2 rounded-full ${bearer.type === 'marketing' ? 'bg-lime-50 text-lime-700 border border-lime-200' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'}`}>
                                {bearer.type === 'marketing' ? 'Marketing Specialist' : 'Kas Platform'}
                              </span>
                            </span>
                            {formData.hpp_bearers.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveBearer(index)}
                                className="text-slate-400 hover:text-rose-500 p-0.5 transition"
                                title="Hapus penanggung modal ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-12 gap-2 items-center">
                            {/* Dropdown Pemilih Penanggung */}
                            <div className="col-span-7">
                              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                Siapa yang menanggung?
                              </label>
                              <select
                                value={bearer.type === 'platform' ? 'platform' : (bearer.specialist_id || '')}
                                onChange={(e) => handleBearerSelectionChange(index, e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                              >
                                <option value="platform">[Platform] Kas Agency</option>
                                <optgroup label="Marketing Specialist">
                                  {marketingSpecialists.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      [Specialist] {m.name}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>

                            {/* Input Nominal Rupiah */}
                            <div className="col-span-5">
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="block text-[10px] font-semibold text-slate-500">
                                  Nominal (Rp)
                                </label>
                                <span className="text-[10px] font-bold text-indigo-600">
                                  {percentage}%
                                </span>
                              </div>
                              <CurrencyInput
                                value={bearer.amount}
                                onChange={(val) => handleBearerAmountChange(index, val)}
                                max={formData.hpp}
                                colorScheme="indigo"
                                showTerbilang={false}
                                placeholder="50.000"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions: Tambah Penanggung, Bagi Rata, Presets */}
                  <div className="pt-2 border-t border-indigo-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleAddBearer}
                        className="px-2.5 py-1 bg-white border border-indigo-200 hover:bg-indigo-50 text-[11px] font-bold rounded-lg text-indigo-700 flex items-center gap-1 transition shadow-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                        Tambah Penanggung
                      </button>

                      <button
                        type="button"
                        onClick={handleEvenSplit}
                        className="px-2.5 py-1 bg-indigo-100/70 hover:bg-indigo-200/70 text-[11px] font-bold rounded-lg text-indigo-800 transition shadow-sm flex items-center gap-1"
                        title="Bagi rata nominal HPP ke seluruh penanggung modal"
                      >
                        <Scale className="w-3.5 h-3.5 text-indigo-700" />
                        Bagi Rata
                      </button>
                    </div>

                    {/* Status Alokasi HPP */}
                    <div className="text-[11px]">
                      {totalAllocated === formData.hpp ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Pas Rp {formData.hpp.toLocaleString('id-ID')} (100%)
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Selisih: Rp {Math.abs(formData.hpp - totalAllocated).toLocaleString('id-ID')}
                          </span>
                          <button
                            type="button"
                            onClick={handleAdjustLastBearer}
                            className="text-[10px] text-indigo-700 hover:underline font-bold"
                          >
                            Auto Pas
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {formData.billing_type === 'subscription' ? (
              <CurrencyInput
                label="Biaya Retainer / Bln (Rp)"
                value={formData.monthly_retainer_fee}
                onChange={(val) => setFormData({ ...formData, monthly_retainer_fee: val })}
                placeholder="149.000"
                presets={[99000, 149000, 199000]}
                showTerbilang
                colorScheme="emerald"
                helpText="Tagihan perpanjangan rutin bulanan klien."
              />
            ) : (
              <div className="w-full bg-purple-50/70 border border-purple-200/80 rounded-xl p-2.5 text-[11px] text-purple-700 leading-tight flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span><strong>Paket Lifetime</strong> — Klien bebas iuran bulanan, akrilik aktif seumur hidup.</span>
              </div>
            )}

            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-600">Marketing Specialist Penanggung Jawab</label>
              {isMarketingSpecialistRole ? (
                <div className="mt-1 flex items-center gap-2 p-2.5 bg-lime-50/70 border border-lime-200 rounded-xl text-xs text-slate-800">
                  <UserCheck className="w-4 h-4 text-[#84cc16] shrink-0" />
                  <div>
                    <p className="font-semibold">{currentSpecialistObj?.name || 'Anda'}</p>
                    <p className="text-[10px] text-slate-500">Otomatis diatribusikan ke akun Anda</p>
                  </div>
                </div>
              ) : (
                <select
                  value={formData.marketing_id}
                  onChange={(e) => setFormData({ ...formData, marketing_id: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none"
                >
                  <option value="">-- Tanpa Marketing Specialist --</option>
                  {marketingSpecialists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.commission_type === 'percentage' ? `${a.commission_rate}%` : `Rp ${a.commission_rate.toLocaleString('id-ID')}`})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Flat Transport Fee Marketing */}
            <CurrencyInput
              label="Uang Transportasi Flat Marketing (Rp)"
              value={formData.transport_fee}
              onChange={(val) => setFormData({ ...formData, transport_fee: val })}
              placeholder="20.000"
              presets={[15000, 20000, 30000, 50000]}
              showTerbilang
              colorScheme="cyan"
              helpText="Diberikan langsung ke marketing specialist yang berhasil mencapai deal closing."
            />

            {/* Live Profit & Payout Breakdown Simulator */}
            <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/90 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Simulasi Bagi Hasil & Payout
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Gross Profit: <strong className="text-emerald-700">Rp {profitDist.gross_profit.toLocaleString('id-ID')}</strong>
                </span>
              </div>

              {/* Rincian Transaksi */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="p-2 bg-white rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">1. Reimburse Modal HPP</p>
                  <p className="mt-0.5 font-medium">Marketing Total: <strong className="text-slate-800">Rp {profitDist.reimburse_marketing.toLocaleString('id-ID')}</strong></p>
                  <p className="font-medium">Platform Total: <strong className="text-slate-800">Rp {profitDist.reimburse_platform.toLocaleString('id-ID')}</strong></p>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">2. Potongan Profit</p>
                  <p className="mt-0.5 font-medium">Fee Platform (10%): <strong className="text-slate-800">Rp {profitDist.platform_fee_10.toLocaleString('id-ID')}</strong></p>
                  <p className="font-medium">Transport Closing: <strong className="text-slate-800">Rp {profitDist.marketing_transport.toLocaleString('id-ID')}</strong></p>
                </div>
              </div>

              {/* Multi-bearer breakdown table if split */}
              {formData.hpp_payer === 'split' && profitDist.bearers_summary && profitDist.bearers_summary.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-indigo-900 tracking-wider">
                    3. Rincian Payout per Penanggung Modal ({profitDist.bearers_summary.length} Pihak):
                  </p>
                  <div className="space-y-1.5">
                    {profitDist.bearers_summary.map((item, idx) => (
                      <div
                        key={item.bearer.id || idx}
                        className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <p className="font-bold text-slate-800 flex items-center gap-1">
                            {item.bearer.name}
                            <span className="text-[9px] font-normal text-slate-400">
                              (Modal {item.ratio.toFixed(1)}%)
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Reimb: Rp {item.reimburse.toLocaleString('id-ID')}
                            {item.transport > 0 ? ` + Trans: Rp ${item.transport.toLocaleString('id-ID')}` : ''}
                            {item.final_share > 0 ? ` + Share: Rp ${item.final_share.toLocaleString('id-ID')}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 text-xs">
                            Rp {item.total_payout.toLocaleString('id-ID')}
                          </p>
                          <p className="text-[10px] font-semibold text-emerald-600">
                            Laba: +Rp {item.net_income.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payout Summary Cards */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-lime-50/80 border border-lime-200 text-lime-900">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-lime-800 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-[#84cc16]" /> Payout Marketing Total
                  </p>
                  <p className="text-base font-black text-slate-900 mt-0.5">
                    Rp {profitDist.marketing_total_payout.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    Reimb {profitDist.reimburse_marketing > 0 ? `${(profitDist.reimburse_marketing / 1000)}k + ` : ''}Trans {(profitDist.marketing_transport / 1000)}k + Bagi {(profitDist.marketing_final_share / 1000)}k
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-cyan-50/80 border border-cyan-200 text-cyan-900">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-cyan-600" /> Payout Platform Total
                  </p>
                  <p className="text-base font-black text-slate-900 mt-0.5">
                    Rp {profitDist.platform_total_payout.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    Reimb {profitDist.reimburse_platform > 0 ? `${(profitDist.reimburse_platform / 1000)}k + ` : ''}Fee {(profitDist.platform_fee_10 / 1000)}k + Bagi {(profitDist.platform_final_share / 1000)}k
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Status Otomatis:</span>
              {(formData.google_review_url || '').trim() ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Aktif (Siap Pakai)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Belum Aktif (Stok)
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-[#84cc16] via-[#10b981] to-[#06b6d4] hover:opacity-95 text-white font-bold rounded-xl flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : venue ? (
                (!venue.google_review_url || venue.google_review_url.trim() === '') ? (
                  <Zap className="w-4 h-4 text-amber-200" />
                ) : (
                  <Save className="w-4 h-4" />
                )
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isSubmitting
                ? 'Menyimpan...'
                : venue
                ? (!venue.google_review_url || venue.google_review_url.trim() === ''
                    ? 'Aktivasi & Simpan Venue'
                    : 'Simpan Perubahan')
                : 'Buat Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

