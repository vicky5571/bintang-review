'use client';

import React, { useState } from 'react';
import { MarketingSpecialist } from '@/lib/types';
import { X, UserPlus, Percent, DollarSign, Phone, Mail, KeyRound, Info } from 'lucide-react';
import { CurrencyInput } from '@/components/CurrencyInput';

interface AdminMarketingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<MarketingSpecialist, 'id' | 'created_at'>) => void;
}

export function AdminMarketingModal({ isOpen, onClose, onSave }: AdminMarketingModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    phone_whatsapp: string;
    email: string;
    access_pin: string;
    commission_type: 'percentage' | 'fixed_amount';
    commission_rate: number;
    is_active: boolean;
  }>({
    name: '',
    phone_whatsapp: '',
    email: '',
    access_pin: '1234',
    commission_type: 'percentage',
    commission_rate: 20,
    is_active: true,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone_whatsapp.trim()) return;

    onSave({
      name: formData.name.trim(),
      phone_whatsapp: formData.phone_whatsapp.trim(),
      email: formData.email.trim() || undefined,
      access_pin: formData.access_pin.trim() || '1234',
      commission_type: formData.commission_type,
      commission_rate: Number(formData.commission_rate),
      is_active: formData.is_active,
    });

    // Reset form
    setFormData({
      name: '',
      phone_whatsapp: '',
      email: '',
      access_pin: '1234',
      commission_type: 'percentage',
      commission_rate: 20,
      is_active: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-lime-500/10 text-[#84cc16] flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Tambah Marketing Specialist
              </h3>
              <p className="text-[11px] text-slate-500">Daftarkan akun tim Marketing Specialist baru</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Nama Lengkap Marketing Specialist *</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none text-xs"
              placeholder="Contoh: Rian Pratama"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Nomor WhatsApp (62...) *</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <input
                required
                type="text"
                value={formData.phone_whatsapp}
                onChange={(e) => setFormData({ ...formData, phone_whatsapp: e.target.value.replace(/\D/g, '') })}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl font-mono focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none text-xs"
                placeholder="6281234567890"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Digunakan sebagai identitas saat login.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">PIN Akses Masuk (4-6 Digit) *</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
              <input
                required
                type="text"
                maxLength={8}
                value={formData.access_pin}
                onChange={(e) => setFormData({ ...formData, access_pin: e.target.value.replace(/\D/g, '') })}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl font-mono tracking-widest focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none text-xs"
                placeholder="1234"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">PIN yang digunakan Marketing Specialist untuk login ke sistem.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Email (Opsional)</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none text-xs"
                placeholder="rian@email.com"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Skema Komisi Marketing</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, commission_type: 'percentage', commission_rate: 20 })}
                  className={`p-2.5 rounded-xl border text-left flex flex-col transition ${
                    formData.commission_type === 'percentage'
                      ? 'border-[#84cc16] bg-lime-50/50 text-slate-900 ring-1 ring-[#84cc16]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-[#84cc16]" /> Persentase (%)
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Dari total nilai deal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, commission_type: 'fixed_amount', commission_rate: 100000 })}
                  className={`p-2.5 rounded-xl border text-left flex flex-col transition ${
                    formData.commission_type === 'fixed_amount'
                      ? 'border-[#06b6d4] bg-cyan-50/50 text-slate-900 ring-1 ring-[#06b6d4]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#06b6d4]" /> Nominal Tetap
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Rp per venue kafe</span>
                </button>
              </div>
            </div>

            {formData.commission_type === 'percentage' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Besaran Komisi (%) <span className="text-rose-500">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    required
                    type="number"
                    min="1"
                    max="100"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none text-xs font-bold"
                    placeholder="20"
                  />
                </div>
                <div className="flex items-start gap-1.5 text-[11px] text-slate-500 mt-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Komisi {formData.commission_rate}% dari paket Rp 599.000 = Rp {Math.round((599000 * formData.commission_rate) / 100).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <CurrencyInput
                  label="Nominal Komisi Tetap per Venue (Rp)"
                  required
                  value={formData.commission_rate}
                  onChange={(val) => setFormData({ ...formData, commission_rate: val })}
                  placeholder="100.000"
                  presets={[50000, 100000, 150000, 200000]}
                  showTerbilang
                  colorScheme="cyan"
                  helpText="Komisi tetap yang diterima Marketing Specialist untuk setiap 1 venue closing."
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <UserPlus className="w-4 h-4" />
              Simpan Marketing Specialist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
