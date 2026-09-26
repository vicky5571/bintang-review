'use client';

import React, { useState } from 'react';
import { MarketingSpecialist } from '@/lib/types';
import { X, UserPlus, Phone, Mail, KeyRound, Info, ShieldCheck } from 'lucide-react';

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

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">Skema Bagi Hasil Kemitraan</label>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Sesuai PKS (Pasal 4)
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-200/80 space-y-2.5 text-xs text-slate-600">
              <p className="text-[11px] leading-relaxed text-slate-600">
                Marketing Specialist beroperasi di bawah <strong>Perjanjian Kemitraan (Pasal 4)</strong>. Hak finansial dihitung otomatis oleh sistem pada setiap transaksi closing:
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-xs">
                  <span className="block font-bold text-slate-800">1. Reimburse HPP</span>
                  <span className="text-[10px] text-slate-500">100% modal akrilik/NFC yang ditalangi</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-xs">
                  <span className="block font-bold text-slate-800">2. Uang Transport</span>
                  <span className="text-[10px] text-slate-500">Flat Rp 20.000 / venue closing</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-xs">
                  <span className="block font-bold text-slate-800">3. Developer Fee (10%)</span>
                  <span className="text-[10px] text-slate-500">Hak founder yang tidak closing (Vicky/Natan)</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200/60 shadow-xs">
                  <span className="block font-bold text-slate-800">4. Bagi Sisa Laba</span>
                  <span className="text-[10px] text-slate-500">Proporsional sesuai modal HPP</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Penanggung modal HPP ditentukan saat Super Admin mendaftarkan venue.</span>
              </div>
            </div>
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
