'use client';

import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2, Loader2, Copy, Check } from 'lucide-react';
import { Venue } from '@/lib/types';

interface PaymentModalProps {
  venue: Venue;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ venue, isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('Transfer BCA');
  const [senderName, setSenderName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedBca, setCopiedBca] = useState(false);

  if (!isOpen) return null;

  const handleCopyBca = () => {
    navigator.clipboard.writeText('8735081234');
    setCopiedBca(true);
    setTimeout(() => setCopiedBca(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim()) {
      setErrorMessage('Mohon isi nama pengirim transfer');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: venue.id,
          amount: venue.monthly_retainer_fee || 49000,
          paymentMethod,
          senderName,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal mengirim konfirmasi');
      } else {
        setSubmitted(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2200);
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-[#00c48c]">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Konfirmasi Terkirim!</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Super Admin akan memverifikasi pembayaran Anda dalam 1x24 jam. Terima kasih!
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#00c48c] flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Perpanjang Langganan Retainer</h3>
                <p className="text-xs text-slate-400">{venue.name}</p>
              </div>
            </div>

            {/* Rekening Tujuan Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-4 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Tagihan Retainer:</span>
                <span className="font-black text-slate-900 text-sm">
                  Rp {(venue.monthly_retainer_fee || 49000).toLocaleString('id-ID')} / bulan
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-blue-600 block">Bank BCA (Transfer Manual)</span>
                  <span className="font-mono text-slate-700 text-sm font-black">8735081234</span>
                  <span className="block text-[11px] text-slate-400">a.n. Bintang Review Indonesia</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyBca}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#00c48c] bg-emerald-50 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                >
                  {copiedBca ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedBca ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            </div>

            {/* Form Konfirmasi */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#00c48c]"
                >
                  <option value="Transfer BCA">Transfer Bank BCA</option>
                  <option value="Transfer Mandiri">Transfer Bank Mandiri</option>
                  <option value="QRIS / E-Wallet">QRIS / E-Wallet (GoPay/OVO/ShopeePay)</option>
                  <option value="Lainnya">Metode Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Nama Pengirim / Pemilik Rekening <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#00c48c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Catatan / No. Referensi Transfer (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ref: 98124982 / Jam transfer: 14.30"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#00c48c]"
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-rose-500 font-medium">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={loading || !senderName.trim()}
                className="w-full mt-2 py-3 bg-gradient-to-r from-[#00c48c] to-[#00a877] text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:brightness-105 active:scale-98 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Mengirim...
                  </>
                ) : (
                  'Kirim Bukti Pembayaran'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
