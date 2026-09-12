'use client';

import React, { useState } from 'react';
import { UserRole, AuthSession } from '@/lib/types';
import { ShieldCheck, Briefcase, ArrowRight, Loader2, Eye, EyeOff, Phone, Lock, Sparkles } from 'lucide-react';

interface UnifiedLoginCardProps {
  onSuccess?: (user: AuthSession) => void;
  redirectUrl?: string;
}

export function UnifiedLoginCard({ onSuccess, redirectUrl = '/admin' }: UnifiedLoginCardProps) {
  const [activeRole, setActiveRole] = useState<UserRole>('super_admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setErrorMessage(null);
    setLoading(true);

    try {
      const payload: any = { role: activeRole };
      if (activeRole === 'super_admin') {
        if (!password.trim()) {
          setErrorMessage('Kata sandi Super Admin wajib diisi.');
          setLoading(false);
          return;
        }
        payload.password = password.trim();
      } else {
        if (!identifier.trim() || !pin.trim()) {
          setErrorMessage('Nomor WhatsApp / Email dan PIN akses wajib diisi.');
          setLoading(false);
          return;
        }
        payload.identifier = identifier.trim();
        payload.pin = pin.trim();
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Autentikasi gagal. Silakan coba lagi.');
        if (activeRole === 'super_admin') {
          setPassword('');
        } else {
          setPin('');
        }
      } else {
        if (onSuccess) {
          onSuccess(data.user);
        } else {
          window.location.href = redirectUrl;
        }
      }
    } catch (err) {
      setErrorMessage('Koneksi ke server terputus. Pastikan internet Anda aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-2xl shadow-slate-200/70 relative">
      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-2xl mb-6 border border-slate-200/60">
        <button
          type="button"
          onClick={() => handleRoleChange('super_admin')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeRole === 'super_admin'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${activeRole === 'super_admin' ? 'text-[#10b981]' : ''}`} />
          Super Admin
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange('marketing_specialist')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeRole === 'marketing_specialist'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className={`w-3.5 h-3.5 ${activeRole === 'marketing_specialist' ? 'text-[#06b6d4]' : ''}`} />
          Marketing Specialist
        </button>
      </div>

      {/* Header Icon & Title */}
      <div className="w-14 h-14 bg-gradient-to-br from-lime-50 to-cyan-50 border border-emerald-200/60 rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#84cc16] shadow-sm">
        {activeRole === 'super_admin' ? (
          <ShieldCheck className="w-7 h-7 text-[#10b981]" />
        ) : (
          <Briefcase className="w-7 h-7 text-[#06b6d4]" />
        )}
      </div>

      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
        {activeRole === 'super_admin' ? 'Super Admin Console' : 'Portal Marketing Specialist'}
      </h1>
      <p className="text-xs text-slate-500 mt-1">
        {activeRole === 'super_admin'
          ? 'Bintang Review — Agency & Platform Management'
          : 'Kelola Klien Kafe & Pantau Komisi Penjualan Anda'}
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
        {activeRole === 'super_admin' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Master Password Admin
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                disabled={loading}
                placeholder="Masukkan kata sandi admin..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl text-xs font-medium focus:outline-none focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor WhatsApp atau Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoFocus
                  disabled={loading}
                  placeholder="628123456789 atau rian@email.com"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl text-xs font-medium focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-cyan-500/20 transition disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                PIN Akses (4-6 Digit)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  maxLength={8}
                  disabled={loading}
                  placeholder="Contoh: 1234"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ''));
                    setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 text-slate-900 font-mono tracking-widest placeholder:tracking-normal placeholder:text-slate-400 rounded-xl text-xs font-bold focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-cyan-500/20 transition disabled:opacity-50"
                />
              </div>
            </div>
          </>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-600 text-xs font-medium animate-in fade-in">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-[#84cc16] via-[#10b981] to-[#06b6d4] hover:opacity-95 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition text-xs mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi Kredensial...
            </>
          ) : (
            <>
              Masuk ke {activeRole === 'super_admin' ? 'Console Admin' : 'Portal Marketing'}{' '}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-lime-500" />
        Sistem terlindungi enkripsi sesi internal & anti-brute force
      </div>
    </div>
  );
}
