'use client';

import React, { useState, useEffect } from 'react';
import { Venue, MarketingSpecialistSummary, RedirectMode, FeedbackChannel, BillingType, UserRole } from '@/lib/types';
import { X, Save, Plus, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';

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
        deal_amount: venue.deal_amount,
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
                  <span className="text-[11px] text-slate-500 mt-0.5">Beli alat sekali, aktif selamanya</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600">Harga Beli Alat / Setup (Rp)</label>
                <input
                  type="number"
                  value={formData.deal_amount}
                  onChange={(e) => setFormData({ ...formData, deal_amount: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none"
                  placeholder="599000"
                />
              </div>

              {formData.billing_type === 'subscription' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Biaya Retainer / Bln (Rp)</label>
                  <input
                    type="number"
                    value={formData.monthly_retainer_fee}
                    onChange={(e) => setFormData({ ...formData, monthly_retainer_fee: Number(e.target.value) })}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none"
                    placeholder="149000"
                  />
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="w-full bg-purple-50/70 border border-purple-200/80 rounded-xl p-2.5 text-[11px] text-purple-700 leading-tight">
                    ✨ <strong>Bebas Iuran</strong> — Akrilik aktif seumur hidup tanpa tagihan perpanjangan.
                  </div>
                </div>
              )}
            </div>

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

