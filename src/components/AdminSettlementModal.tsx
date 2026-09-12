'use client';

import React, { useState } from 'react';
import { Venue } from '@/lib/types';
import { calculateProfitDistribution, calculateVenueSettlement } from '@/lib/profitSharing';
import { X, CheckCircle2, DollarSign, Send, ArrowRight, Loader2, AlertCircle, Percent, Briefcase, Building2, Users, User } from 'lucide-react';

interface AdminSettlementModalProps {
  venue: Venue | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminSettlementModal({
  venue,
  isOpen,
  onClose,
  onSuccess,
}: AdminSettlementModalProps) {
  if (!isOpen || !venue) return null;

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

  const marketingBearers = settlement.bearers_settlement;
  const isMultiMarketing = marketingBearers.length > 1;

  const [selectedBearerId, setSelectedBearerId] = useState<string>('all');
  const [settleType, setSettleType] = useState<'hpp_reimburse' | 'profit_share' | 'both'>('both');
  const [status, setStatus] = useState<'paid' | 'unpaid'>('paid');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetBearer = selectedBearerId !== 'all'
    ? marketingBearers.find((b) => b.bearer.id === selectedBearerId)
    : null;

  const activeReimburseAmount = targetBearer ? targetBearer.reimburse : settlement.reimburse_marketing;
  const activeProfitShareAmount = targetBearer ? targetBearer.profit_share : settlement.profit_share_marketing;
  const activeTotalPayout = activeReimburseAmount + activeProfitShareAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/venues/settlement', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venue_id: venue.id,
          bearer_id: selectedBearerId === 'all' ? undefined : selectedBearerId,
          type: settleType,
          status,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan status pelunasan');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError('Koneksi terputus saat menyimpan status settlement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Kelola Pelunasan Payout</h3>
            <p className="text-xs text-slate-400 mt-0.5">{venue.name}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-bearer HPP Context & Info Box */}
        {dist.bearers_summary && dist.bearers_summary.length > 1 ? (
          <div className="mt-3 p-3.5 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl text-[11px] text-indigo-950 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-indigo-800">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Penanggung Modal HPP ({dist.bearers_summary.length} Pihak Bersama)
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Total HPP adalah <strong>Rp {dist.hpp.toLocaleString('id-ID')}</strong> yang ditanggung bersama oleh:
            </p>
            <div className="space-y-1.5 pt-1">
              {dist.bearers_summary.map((b, idx) => (
                <div key={b.bearer.id || idx} className="p-2 bg-white/90 rounded-xl border border-indigo-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-700 font-medium flex items-center gap-1.5">
                    {b.bearer.type === 'platform' ? (
                      <Building2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <span>{b.bearer.name}</span>
                  </span>
                  <span className="font-bold text-slate-800">
                    Rp {b.amount.toLocaleString('id-ID')} ({b.ratio.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : dist.hpp_payer === 'platform' ? (
          <div className="mt-3 p-3 bg-cyan-50/80 border border-cyan-200/80 rounded-2xl text-[11px] text-cyan-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-cyan-800">
              <Building2 className="w-3.5 h-3.5 text-cyan-600" />
              Penanggung HPP: 100% Kas Platform
            </div>
            <p className="text-slate-600 text-[11px]">
              Seluruh modal HPP (Rp {dist.hpp.toLocaleString('id-ID')}) ditalangi platform. Tidak ada modal HPP yang perlu ditransfer ke marketing specialist.
            </p>
          </div>
        ) : (
          <div className="mt-3 p-3 bg-lime-50/80 border border-lime-200/80 rounded-2xl text-[11px] text-slate-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-lime-800">
              <Briefcase className="w-3.5 h-3.5 text-[#84cc16]" />
              Penanggung HPP: 100% Marketing Specialist
            </div>
            <p className="text-slate-600 text-[11px]">
              Marketing Specialist menanggung penuh modal awal Rp {dist.hpp.toLocaleString('id-ID')} dan berhak menerima 100% reimburse.
            </p>
          </div>
        )}

        {/* Status Saat Ini - Multi-Bearer Breakdown */}
        {isMultiMarketing ? (
          <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 text-xs">
            <div className="font-bold text-slate-700 flex items-center justify-between text-[11px]">
              <span>Rincian Status Pelunasan Tiap Marketing Specialist:</span>
              <span className="text-[10px] text-slate-400 font-normal">{marketingBearers.length} Orang</span>
            </div>
            <div className="space-y-2">
              {marketingBearers.map((item) => (
                <div key={item.bearer.id} className="p-2.5 bg-white rounded-xl border border-slate-200/70 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {item.bearer.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Total Hak: Rp {(item.reimburse + item.profit_share).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-500 block">Reimburse Modal:</span>
                      <span className={`font-bold ${item.reimburse_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        Rp {item.reimburse.toLocaleString('id-ID')}{' '}
                        ({item.reimburse_status === 'paid' ? 'Lunas' : 'Belum'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Bagi Hasil:</span>
                      <span className={`font-bold ${item.profit_share_status === 'paid' ? 'text-emerald-600' : 'text-cyan-600'}`}>
                        Rp {item.profit_share.toLocaleString('id-ID')}{' '}
                        ({item.profit_share_status === 'paid' ? 'Lunas' : 'Belum'})
                      </span>
                    </div>
                  </div>
                  {item.transport > 0 && (
                    <div className="text-[9px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                      Termasuk Uang Transport Closing: Rp {item.transport.toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Reimburse Modal HPP ke Marketing:</span>
              <div className="text-right">
                {settlement.reimburse_status === 'not_applicable' ? (
                  <span className="text-[10px] text-slate-400 font-semibold">Bukan Hak Marketing (0 Hak)</span>
                ) : (
                  <span className={`font-bold ${settlement.reimburse_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    Rp {settlement.reimburse_marketing.toLocaleString('id-ID')}{' '}
                    ({settlement.reimburse_status === 'paid' ? 'Lunas' : 'Belum Diganti'})
                  </span>
                )}
              </div>
            </div>
            {venue.hpp_reimburse_notes && (
              <div className="text-[10px] text-slate-500 italic bg-white p-1.5 rounded-lg border border-slate-200/60">
                Ref Reimburse: {venue.hpp_reimburse_notes}
              </div>
            )}

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">Bagi Hasil & Transport Marketing:</span>
              <span className={`font-bold ${settlement.profit_share_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                Rp {settlement.profit_share_marketing.toLocaleString('id-ID')}{' '}
                ({settlement.profit_share_status === 'paid' ? 'Lunas' : 'Belum Ditransfer'})
              </span>
            </div>
            {venue.profit_share_notes && (
              <div className="text-[10px] text-slate-500 italic bg-white p-1.5 rounded-lg border border-slate-200/60">
                Ref Bagi Hasil: {venue.profit_share_notes}
              </div>
            )}

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-500">
              <span>Rincian Hak Marketing:</span>
              <span className="font-semibold text-slate-700">
                Transport: Rp {dist.marketing_transport.toLocaleString('id-ID')} + Share: Rp {dist.marketing_final_share.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Target Penerima Payout (if multiple marketing specialists) */}
          {isMultiMarketing && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Pilih Penerima Payout yang Ingin Diupdate
              </label>
              <select
                value={selectedBearerId}
                onChange={(e) => setSelectedBearerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 focus:outline-none focus:border-[#84cc16]"
              >
                <option value="all">
                  Semua Marketing Specialist Sekaligus (Total Rp {dist.marketing_total_payout.toLocaleString('id-ID')})
                </option>
                {marketingBearers.map((b) => (
                  <option key={b.bearer.id} value={b.bearer.id}>
                    {b.bearer.name} (Total Rp {(b.reimburse + b.profit_share).toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Komponen yang ingin diselesaikan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Pilih Komponen yang Ingin Diupdate
              {targetBearer && <span className="font-normal text-slate-500 ml-1">({targetBearer.bearer.name})</span>}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSettleType('hpp_reimburse')}
                disabled={activeReimburseAmount === 0}
                className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center disabled:opacity-40 ${
                  settleType === 'hpp_reimburse'
                    ? 'border-amber-500 bg-amber-50 text-slate-900 ring-1 ring-amber-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-[11px]">Hanya HPP</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Rp {activeReimburseAmount.toLocaleString('id-ID')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSettleType('profit_share')}
                className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                  settleType === 'profit_share'
                    ? 'border-cyan-500 bg-cyan-50 text-slate-900 ring-1 ring-cyan-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-[11px]">Bagi Hasil</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Rp {activeProfitShareAmount.toLocaleString('id-ID')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSettleType('both')}
                className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                  settleType === 'both'
                    ? 'border-[#84cc16] bg-lime-50 text-slate-900 ring-1 ring-[#84cc16]'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-[11px]">Semua (Total)</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Rp {activeTotalPayout.toLocaleString('id-ID')}
                </span>
              </button>
            </div>
          </div>

          {/* Status Pelunasan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Ubah Status Menjadi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('paid')}
                className={`p-2.5 rounded-xl border text-center font-bold transition flex items-center justify-center gap-1.5 ${
                  status === 'paid'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Lunas / Ditransfer
              </button>

              <button
                type="button"
                onClick={() => setStatus('unpaid')}
                className={`p-2.5 rounded-xl border text-center font-bold transition flex items-center justify-center gap-1.5 ${
                  status === 'unpaid'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 ring-1 ring-rose-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Belum Dibayar
              </button>
            </div>
          </div>

          {/* Catatan / Nomor Referensi Transfer */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Catatan Bukti / No. Referensi Transfer (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Transfer BCA Ref #84912 atau a.n. Rian"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 focus:outline-none"
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
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-[#84cc16] via-[#10b981] to-[#06b6d4] text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 hover:opacity-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Simpan Settlement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
