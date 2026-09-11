'use client';

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  onSuccess: () => void;
}

export function AdminLoginModal({ onSuccess }: AdminLoginModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Password salah, silakan coba lagi');
        setPassword('');
      } else {
        onSuccess();
      }
    } catch (err) {
      setErrorMessage('Koneksi ke server gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-gradient-to-r from-lime-200/25 via-emerald-200/20 to-cyan-200/25 blur-3xl -z-10 pointer-events-none rounded-full" />

      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 text-center shadow-2xl shadow-slate-200/70">
        <div className="w-16 h-16 bg-gradient-to-br from-lime-50 to-cyan-50 border border-emerald-200/60 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#84cc16] shadow-sm">
          <ShieldCheck className="w-8 h-8 text-[#10b981]" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Super Admin Console</h1>
        <p className="text-xs text-slate-500 mt-1.5">
          Bintang Review — Agency & Platform Management
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
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
                className="w-full px-4 py-3.5 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl text-sm font-medium focus:outline-none focus:border-[#84cc16] focus:ring-2 focus:ring-lime-500/20 transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errorMessage && (
              <p className="text-xs text-rose-500 font-medium mt-2">
                {errorMessage}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-[#84cc16] via-[#10b981] to-[#06b6d4] hover:opacity-95 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition text-sm mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi...
              </>
            ) : (
              <>
                Masuk ke Console <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 mt-6">
          Sistem terlindungi enkripsi sesi internal.
        </p>
      </div>
    </div>
  );
}
