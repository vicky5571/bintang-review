'use client';

import React, { useState } from 'react';
import { AuthSession } from '@/lib/types';
import { Store, ArrowRight, Loader2, Eye, EyeOff, Phone, Lock, Sparkles, Shield } from 'lucide-react';
import Link from 'next/link';

interface OwnerLoginCardProps {
  onSuccess?: (user: AuthSession) => void;
  redirectUrl?: string;
}

export function OwnerLoginCard({ onSuccess, redirectUrl }: OwnerLoginCardProps) {
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setErrorMessage(null);
    setLoading(true);

    try {
      if (!identifier.trim() || !pin.trim()) {
        setErrorMessage('Nomor WhatsApp atau Slug Kafe dan PIN akses wajib diisi.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'owner',
          identifier: identifier.trim(),
          pin: pin.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Nomor WhatsApp atau PIN akses salah. Silakan coba lagi.');
        setPin('');
      } else {
        if (onSuccess) {
          onSuccess(data.user);
        }
        
        // Ensure owner is ALWAYS directed to their cafe's read-only portal
        const targetUrl = data.redirectUrl || (data.user?.venue_slug ? `/portal/${data.user.venue_slug}` : redirectUrl || '/');
        window.location.href = targetUrl;
      }
    } catch (err) {
      setErrorMessage('Koneksi ke server terputus. Pastikan internet Anda aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-2xl shadow-slate-200/70 relative">
      {/* Header Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold mb-5">
        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
        Portal Khusus Owner Kafe
      </div>

      {/* Header Icon & Title */}
      <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-600 shadow-sm">
        <Store className="w-8 h-8 text-emerald-600" />
      </div>

      <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
        Masuk ke Portal Kafe
      </h1>
      <p className="text-slate-500 text-xs sm:text-sm mb-6 leading-relaxed">
        Pantau ulasan pelanggan, statistik tap QR, dan feedback kritik saran kafe Anda secara real-time.
      </p>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-medium text-left flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Nomor WhatsApp / Slug Kafe
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Contoh: 08123456789 atau kopi-senja"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-medium placeholder:text-slate-400"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Gunakan nomor WhatsApp pemilik kafe yang terdaftar pada kartu QR.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            PIN Akses Kafe
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Masukkan PIN akses 4-6 digit"
              required
              maxLength={10}
              className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-mono placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
              tabIndex={-1}
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memverifikasi Akses Kafe...</span>
            </>
          ) : (
            <>
              <span>Masuk ke Portal Kafe</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Internal Staff Link Footer */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-2">
        <p className="text-xs text-slate-400">
          Bukan pemilik kafe?
        </p>
        <Link
          href="/admin/login"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-slate-100"
        >
          <Shield className="w-3.5 h-3.5 text-slate-500" />
          <span>Login Tim Internal (Marketing & Admin) &rarr;</span>
        </Link>
      </div>
    </div>
  );
}

