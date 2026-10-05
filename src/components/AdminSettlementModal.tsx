'use client';

import React, { useState, useEffect } from 'react';
import { Venue, RemittanceStatus } from '@/lib/types';
import { calculateProfitDistribution, calculateVenueSettlement } from '@/lib/profitSharing';
import {
  X,
  CheckCircle2,
  DollarSign,
  Send,
  Loader2,
  AlertCircle,
  Building2,
  Briefcase,
  Copy,
  Check,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface AdminSettlementModalProps {
  venue: Venue | null;
  isOpen: boolean;
  userRole?: 'super_admin' | 'marketing_specialist' | 'owner';
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminSettlementModal({
  venue,
  isOpen,
  userRole = 'super_admin',
  onClose,
  onSuccess,
}: AdminSettlementModalProps) {
  if (!isOpen || !venue) return null;

  const isSuperAdmin = userRole === 'super_admin';
  const settlement = calculateVenueSettlement(venue);
  const dist = calculateProfitDistribution({
    deal_amount: venue.deal_amount,
    hpp: venue.hpp,
    hpp_payer: venue.hpp_payer,
    hpp_marketing_ratio: venue.hpp_marketing_ratio,
    hpp_marketing_amount: venue.hpp_marketing_amount,
    hpp_bearers: venue.hpp_bearers,
    closing_specialist_id: venue.sales_id || venue.marketing_id,
    transport_fee: venue.transport_fee,
  });

  const remittanceDue = dist.platform_remittance_due;
  const marketingRetained = dist.marketing_retained;
  const currentStatus: RemittanceStatus =
    venue.remittance_status || (venue.profit_share_status === 'paid' ? 'verified' : 'unpaid');

  const [remittanceStatus, setRemittanceStatus] = useState<'unpaid' | 'submitted' | 'verified'>(
    currentStatus === 'not_applicable' ? 'verified' : currentStatus
  );
  const [notes, setNotes] = useState(venue.remittance_notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedBca, setCopiedBca] = useState(false);

  useEffect(() => {
    if (venue) {
      const initStatus: RemittanceStatus =
        venue.remittance_status || (venue.profit_share_status === 'paid' ? 'verified' : 'unpaid');
      setRemittanceStatus(initStatus === 'not_applicable' ? 'verified' : initStatus);
      setNotes(venue.remittance_notes || '');
      setError(null);
    }
  }, [venue]);

  const handleCopyBca = () => {
    navigator.clipboard.writeText('8735081234');
    setCopiedBca(true);
    setTimeout(() => setCopiedBca(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const targetStatus = isSuperAdmin ? remittanceStatus : 'submitted';

    try {
      const res = await fetch('/api/admin/venues/settlement', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_id: venue.id,
          remittance_status: targetStatus,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan status setoran.');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError('Koneksi terputus saat menyimpan status setoran.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              {isSuperAdmin ? 'Verifikasi Setoran Lapangan' : 'Konfirmasi Setor ke Kantor'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{venue.name}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Pillar Financial Truth Cards */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
            <span className="block text-[10px] font-semibold text-slate-500">Deal di Tangan</span>
            <span className="block text-xs font-black text-slate-900 mt-1">
              Rp {venue.deal_amount.toLocaleString('id-ID')}
            </span>
            <span className="block text-[9px] text-slate-400 mt-0.5">Diterima Marketing</span>
          </div>

          <div className="bg-teal-50/70 border border-teal-200/70 rounded-2xl p-3 text-center">
            <span className="block text-[10px] font-semibold text-teal-700">Hak Marketing</span>
            <span className="block text-xs font-black text-teal-800 mt-1">
              Rp {marketingRetained.toLocaleString('id-ID')}
            </span>
            <span className="block text-[9px] text-teal-600 mt-0.5">Dipotong Langsung</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 text-center shadow-xs">
            <span className="block text-[10px] font-bold text-emerald-800">Wajib Setor</span>
            <span className="block text-xs font-black text-emerald-900 mt-1">
              Rp {remittanceDue.toLocaleString('id-ID')}
            </span>
            <span className="block text-[9px] text-emerald-700 font-medium mt-0.5">Ke Kas Platform</span>
          </div>
        </div>

        {/* Breakdown Context */}
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] text-slate-600 space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Rincian Hak Bersih Marketing:</span>
            <span className="font-semibold text-slate-700">
              Reimb HPP: Rp {dist.reimburse_marketing.toLocaleString('id-ID')} + Bensin: Rp {dist.marketing_transport.toLocaleString('id-ID')} + Share: Rp {dist.marketing_final_share.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-200/60">
            <span className="text-slate-500">Rincian Wajib Setor Kantor:</span>
            <span className="font-bold text-emerald-800">
              Reimb Platform: Rp {dist.reimburse_platform.toLocaleString('id-ID')} + Fee Dev (10%): Rp {dist.developer_fee_10.toLocaleString('id-ID')} + Share: Rp {dist.platform_final_share.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Platform Destination Bank Box */}
        <div className="mt-3.5 bg-gradient-to-br from-emerald-50/90 to-teal-50/60 border border-emerald-200/80 rounded-2xl p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-emerald-900 block text-xs">Rekening Tujuan Setoran Platform:</span>
              <span className="font-mono text-slate-900 text-sm font-black">8735081234</span>
              <span className="block text-[11px] text-slate-500">Bank BCA a.n. Bintang Review Indonesia</span>
            </div>
            <button
              type="button"
              onClick={handleCopyBca}
              className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs hover:bg-emerald-50 transition"
            >
              {copiedBca ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedBca ? 'Tersalin' : 'Salin BCA'}
            </button>
          </div>
        </div>

        {/* Current Remittance Status Banner */}
        <div className="mt-3 p-3 rounded-2xl border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {currentStatus === 'verified' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : currentStatus === 'submitted' ? (
              <Clock className="w-4 h-4 text-cyan-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <div>
              <span className="font-bold text-slate-800">
                {currentStatus === 'verified'
                  ? 'Setoran Lunas & Terverifikasi'
                  : currentStatus === 'submitted'
                  ? 'Menunggu Pengecekan Mutasi Bank'
                  : 'Belum Disetorkan'}
              </span>
              {venue.remittance_notes && (
                <p className="text-[10px] text-slate-500 mt-0.5 italic">Ref: {venue.remittance_notes}</p>
              )}
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              currentStatus === 'verified'
                ? 'bg-emerald-100 text-emerald-800'
                : currentStatus === 'submitted'
                ? 'bg-cyan-100 text-cyan-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {currentStatus === 'verified' ? 'Lunas' : currentStatus === 'submitted' ? 'Dicek' : 'Pending'}
          </span>
        </div>

        {/* Status Update Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {isSuperAdmin && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Ubah Status Setoran Menjadi
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRemittanceStatus('verified')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition flex items-center justify-center gap-1 ${
                    remittanceStatus === 'verified'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px]">Setor Lunas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRemittanceStatus('submitted')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition flex items-center justify-center gap-1 ${
                    remittanceStatus === 'submitted'
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-800 ring-1 ring-cyan-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-cyan-600" />
                  <span className="text-[11px]">Sudah Transfer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRemittanceStatus('unpaid')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition flex items-center justify-center gap-1 ${
                    remittanceStatus === 'unpaid'
                      ? 'border-rose-500 bg-rose-50 text-rose-800 ring-1 ring-rose-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-[11px]">Belum Setor</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {isSuperAdmin ? 'Catatan Verifikasi / Ref Mutasi Bank (Opsional)' : 'Catatan Transfer Setoran'}
            </label>
            <input
              type="text"
              required={!isSuperAdmin}
              placeholder={
                isSuperAdmin
                  ? 'Contoh: Mutasi BCA masuk Rp 44.900 terverifikasi'
                  : 'Contoh: Transfer m-BCA a.n. Budi jam 14:30 ref #89214'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#00c48c] focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50"
            >
              Tutup
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-[#00c48c] to-[#00a877] text-slate-950 font-bold rounded-xl shadow-md shadow-emerald-500/20 hover:brightness-105 flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  {isSuperAdmin ? 'Simpan Verifikasi Setoran' : 'Kirim Bukti / Konfirmasi Setor'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
