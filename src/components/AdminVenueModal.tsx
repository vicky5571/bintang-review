'use client';

import React, { useState, useEffect } from 'react';
import { Venue, SalesAgentSummary } from '@/lib/types';
import { X, Save, Plus } from 'lucide-react';

interface AdminVenueModalProps {
  venue: Venue | null;
  isOpen: boolean;
  salesAgents: SalesAgentSummary[];
  onClose: () => void;
  onSave: (data: Partial<Venue>) => void;
}

export function AdminVenueModal({ venue, isOpen, salesAgents, onClose, onSave }: AdminVenueModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    google_review_url: '',
    redirect_mode: 'smart_funnel' as const,
    feedback_channels: 'whatsapp' as const,
    whatsapp_number: '',
    owner_access_pin: '1234',
    is_active: true,
    sales_id: '',
    deal_amount: 599000,
    monthly_retainer_fee: 49000,
  });

  useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name,
        slug: venue.slug,
        google_review_url: venue.google_review_url,
        redirect_mode: venue.redirect_mode,
        feedback_channels: venue.feedback_channels,
        whatsapp_number: venue.whatsapp_number || '',
        owner_access_pin: venue.owner_access_pin,
        is_active: venue.is_active,
        sales_id: venue.sales_id || '',
        deal_amount: venue.deal_amount,
        monthly_retainer_fee: venue.monthly_retainer_fee,
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
        sales_id: salesAgents[0]?.id || '',
        deal_amount: 599000,
        monthly_retainer_fee: 49000,
      });
    }
  }, [venue, salesAgents]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b">
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
                className="mt-1 w-full px-3 py-2 border rounded-xl"
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
                className="mt-1 w-full px-3 py-2 border rounded-xl font-mono"
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
              className="mt-1 w-full px-3 py-2 border rounded-xl font-mono text-xs"
              placeholder="https://search.google.com/local/writereview?placeid=..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600">Mode Routing</label>
              <select
                value={formData.redirect_mode}
                onChange={(e) => setFormData({ ...formData, redirect_mode: e.target.value as any })}
                className="mt-1 w-full px-3 py-2 border rounded-xl bg-white"
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
                className="mt-1 w-full px-3 py-2 border rounded-xl bg-white"
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
                className="mt-1 w-full px-3 py-2 border rounded-xl font-mono"
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
                className="mt-1 w-full px-3 py-2 border rounded-xl font-mono text-center tracking-wider"
                placeholder="1234"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <label className="block text-xs font-semibold text-slate-600">Sales Agent Attribution</label>
              <select
                value={formData.sales_id}
                onChange={(e) => setFormData({ ...formData, sales_id: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-xl bg-white"
              >
                <option value="">-- Pilih Sales Agent --</option>
                {salesAgents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.commission_rate}%)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600">Deal Package Amount (Rp)</label>
              <input
                type="number"
                value={formData.deal_amount}
                onChange={(e) => setFormData({ ...formData, deal_amount: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border rounded-xl"
                placeholder="599000"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs font-medium text-slate-700">Status Stand Akrilik Aktif</span>
            </label>

            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl flex items-center gap-2 hover:bg-slate-800 active:scale-95"
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
