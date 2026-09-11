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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#00c48c] shadow-lg shadow-emerald-500/10">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight">Super Admin Console</h1>
        <p className="text-xs text-slate-400 mt-1.5">
          Bintang Review — Agency & Platform Management
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
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
                className="w-full px-4 py-3.5 bg-slate-800/80 border border-slate-700 text-white rounded-xl text-sm font-medium focus:outline-none focus:border-[#00c48c] focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errorMessage && (
              <p className="text-xs text-rose-400 font-medium mt-2">
                {errorMessage}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-[#00c48c] to-[#00a877] hover:brightness-105 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition text-sm mt-4"
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

        <p className="text-[11px] text-slate-500 mt-6">
          Sistem terlindungi enkripsi sesi internal.
        </p>
      </div>
    </div>
  );
}
