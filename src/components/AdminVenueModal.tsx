'use client';

import React, { useState, useEffect } from 'react';
import { Venue, MarketingSpecialistSummary, RedirectMode, FeedbackChannel, BillingType, UserRole, HppPayerType } from '@/lib/types';
import { calculateProfitDistribution } from '@/lib/profitSharing';
import { X, Save, Plus, ShieldCheck, Sparkles, UserCheck, DollarSign, Car, Building2, Briefcase, Percent } from 'lucide-react';

interface AdminVenueModalProps {
  venue: Venue | null;
  isOpen: boolean;
  marketingSpecialists: MarketingSpecialistSummary[];
  currentRole?: UserRole;
  currentSpecialistId?: string;
  onClose: () => void;
  onSave: (data: Partial<Venue>) => void;
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

  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    google_review_url: string;
    redirect_mode: RedirectMode;
    feedback_channels: FeedbackChannel;
    whatsapp_number: string;
    owner_access_pin: string;
    is_active: boolean;
    marketing_id: string;
    deal_amount: number;
    hpp: number;
    hpp_payer: HppPayerType;
    hpp_marketing_ratio: number;
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
    is_active: true,
    marketing_id: '',
    deal_amount: 599000,
    hpp: 150000,
    hpp_payer: 'marketing',
    hpp_marketing_ratio: 100,
    transport_fee: 20000,
    billing_type: 'subscription',
    monthly_retainer_fee: 149000,
  });

  useEffect(() => {
    const defaultMarketingId = isMarketingSpecialistRole
      ? (currentSpecialistId || '')
      : (marketingSpecialists[0]?.id || '');

    if (venue) {
      const isOneTime = venue.billing_type === 'one_time' || venue.monthly_retainer_fee === 0;
      setFormData({
        name: venue.name,
        slug: venue.slug,
        google_review_url: venue.google_review_url,
        redirect_mode: venue.redirect_mode,
        feedback_channels: venue.feedback_channels,
        whatsapp_number: venue.whatsapp_number || '',
        owner_access_pin: venue.owner_access_pin,
        is_active: venue.is_active,
        marketing_id: isMarketingSpecialistRole ? (currentSpecialistId || '') : (venue.marketing_id || venue.sales_id || ''),
        deal_amount: venue.deal_amount !== undefined ? Number(venue.deal_amount) : 599000,
        hpp: venue.hpp !== undefined && venue.hpp !== null ? Number(venue.hpp) : 150000,
        hpp_payer: venue.hpp_payer || 'marketing',
        hpp_marketing_ratio: venue.hpp_marketing_ratio !== undefined ? Number(venue.hpp_marketing_ratio) : 100,
        transport_fee: venue.transport_fee !== undefined ? Number(venue.transport_fee) : 20000,
        billing_type: isOneTime ? 'one_time' : 'subscription',
        monthly_retainer_fee: isOneTime ? 0 : (venue.monthly_retainer_fee || 149000),
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        google_review_url: '',
        redirect_mode: 'smart_funnel',
        feedback_channels: 'whatsapp',
        whatsapp_number: '',
        owner_access_pin: '1234',
        is_active: true,
        marketing_id: defaultMarketingId,
        deal_amount: 599000,
        hpp: 150000,
        hpp_payer: 'marketing',
        hpp_marketing_ratio: 100,
        transport_fee: 20000,
        billing_type: 'subscription',
        monthly_retainer_fee: 149000,
      });
    }
  }, [venue, marketingSpecialists, isMarketingSpecialistRole, currentSpecialistId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      sales_id: formData.marketing_id,
    });
  };

  const currentSpecialistObj = marketingSpecialists.find((m) => m.id === (currentSpecialistId || formData.marketing_id));

  const profitDist = calculateProfitDistribution({
    deal_amount: formData.deal_amount,
    hpp: formData.hpp,
    hpp_payer: formData.hpp_payer,
    hpp_marketing_ratio: formData.hpp_marketing_ratio,
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
            <label className="block text-xs font-semibold text-slate-600">Google Review Write URL *</label>
            <input
              required
              type="url"
              value={formData.google_review_url}
              onChange={(e) => setFormData({ ...formData, google_review_url: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none"
              placeholder="https://search.google.com/local/writereview?placeid=..."
            />
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
                    🔄 Langganan Bulanan
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
                    💎 Sekali Bayar (Lifetime)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Sekali bayar, aktif selamanya tanpa iuran</span>
                </button>
              </div>
            </div>

            {/* Financials: Harga Jual & HPP Per Transaksi */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Harga Jual ke Klien (Rp) *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.deal_amount}
                  onChange={(e) => setFormData({ ...formData, deal_amount: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none text-xs"
                  placeholder="599000"
                />
                <p className="text-[10px] text-slate-400 mt-1">Nilai total closing deal.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  HPP / Modal Produksi (Rp) *
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={formData.hpp}
                  onChange={(e) => setFormData({ ...formData, hpp: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 focus:outline-none text-xs"
                  placeholder="150000"
                />
                <p className="text-[10px] text-slate-400 mt-1">Biaya cetak akrilik, chip NFC & packing.</p>
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
                  onClick={() => setFormData({ ...formData, hpp_payer: 'marketing', hpp_marketing_ratio: 100 })}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    formData.hpp_payer === 'marketing'
                      ? 'border-[#84cc16] bg-lime-50 text-slate-900 ring-1 ring-[#84cc16]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 mb-1 text-[#84cc16]" />
                  <span className="text-[11px] font-bold">Marketing (100%)</span>
                  <span className="text-[9px] text-slate-400">Modal dari Specialist</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hpp_payer: 'platform', hpp_marketing_ratio: 0 })}
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
                  onClick={() => setFormData({ ...formData, hpp_payer: 'split', hpp_marketing_ratio: 50 })}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                    formData.hpp_payer === 'split'
                      ? 'border-indigo-500 bg-indigo-50 text-slate-900 ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5 mb-1 text-indigo-600" />
                  <span className="text-[11px] font-bold">Split Bersama</span>
                  <span className="text-[9px] text-slate-400">{formData.hpp_marketing_ratio}% : {100 - formData.hpp_marketing_ratio}%</span>
                </button>
              </div>

              {formData.hpp_payer === 'split' && (
                <div className="mt-2 p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Porsi HPP Marketing:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.hpp_marketing_ratio}
                      onChange={(e) => setFormData({ ...formData, hpp_marketing_ratio: Number(e.target.value) })}
                      className="w-28 accent-indigo-600 cursor-pointer"
                    />
                    <span className="font-bold font-mono text-indigo-700 w-12 text-right">
                      {formData.hpp_marketing_ratio}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Flat Transport Fee Marketing */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Uang Transportasi Flat Marketing (Rp)
                </label>
                <span className="text-[10px] text-slate-400">Default Rp 20.000</span>
              </div>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Car className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.transport_fee}
                  onChange={(e) => setFormData({ ...formData, transport_fee: Number(e.target.value) })}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none text-xs"
                  placeholder="20000"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Diberikan langsung ke marketing specialist yang berhasil mencapai deal.
              </p>
            </div>

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
                  <p className="mt-0.5 font-medium">Marketing: <strong className="text-slate-800">Rp {profitDist.reimburse_marketing.toLocaleString('id-ID')}</strong></p>
                  <p className="font-medium">Platform: <strong className="text-slate-800">Rp {profitDist.reimburse_platform.toLocaleString('id-ID')}</strong></p>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">2. Potongan Profit</p>
                  <p className="mt-0.5 font-medium">Fee Platform (10%): <strong className="text-slate-800">Rp {profitDist.platform_fee_10.toLocaleString('id-ID')}</strong></p>
                  <p className="font-medium">Transport Mktg: <strong className="text-slate-800">Rp {profitDist.marketing_transport.toLocaleString('id-ID')}</strong></p>
                </div>
              </div>

              {/* Payout Banner */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-lime-50/80 border border-lime-200 text-lime-900">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-lime-800 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-[#84cc16]" /> Payout Marketing
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
                    <Building2 className="w-3 h-3 text-cyan-600" /> Payout Platform
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

            {formData.billing_type === 'subscription' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700">Biaya Retainer / Bln (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.monthly_retainer_fee}
                  onChange={(e) => setFormData({ ...formData, monthly_retainer_fee: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none text-xs font-bold"
                  placeholder="149000"
                />
                <p className="text-[10px] text-slate-400 mt-1">Tagihan perpanjangan rutin bulanan klien.</p>
              </div>
            ) : (
              <div className="w-full bg-purple-50/70 border border-purple-200/80 rounded-xl p-2.5 text-[11px] text-purple-700 leading-tight">
                ✨ <strong>Paket Lifetime</strong> — Klien bebas iuran bulanan, akrilik aktif seumur hidup.
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
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-[#84cc16] focus:ring-[#84cc16]"
              />
              <span className="text-xs font-medium text-slate-700">Status Stand Akrilik Aktif</span>
            </label>

            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-[#84cc16] via-[#10b981] to-[#06b6d4] hover:opacity-95 text-white font-bold rounded-xl flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition"
            >
              {venue ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {venue ? 'Simpan Perubahan' : 'Buat Venue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

