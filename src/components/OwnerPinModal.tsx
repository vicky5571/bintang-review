'use client';

import React, { useState } from 'react';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';

export function verifyOwnerPin(inputPin: string, correctPin: string): boolean {
  return inputPin.trim() === correctPin.trim();
}

interface OwnerPinModalProps {
  venueName?: string;
  onVerify?: (pin: string) => Promise<{ success: boolean; error?: string } | boolean>;
  correctPin?: string;
  onSuccess?: () => void;
}

export function OwnerPinModal({
  venueName,
  onVerify,
  correctPin,
  onSuccess,
}: OwnerPinModalProps) {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || loading) return;

    // Server-side verification flow
    if (onVerify) {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await onVerify(pin);
        if (typeof res === 'boolean') {
          if (!res) {
            setErrorMessage('PIN salah, silakan coba lagi');
            setPin('');
          }
        } else if (!res.success) {
          setErrorMessage(res.error || 'PIN salah, silakan coba lagi');
          setPin('');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Terjadi kesalahan verifikasi';
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Fallback client check
    if (correctPin) {
      if (verifyOwnerPin(pin, correctPin)) {
        onSuccess?.();
      } else {
        setErrorMessage('PIN salah, silakan coba lagi');
        setPin('');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#00c48c] border border-emerald-100/60 shadow-sm">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Owner Portal</h2>
        {venueName && <p className="text-xs text-slate-500 mt-1">{venueName}</p>}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">
              Masukkan 4-Digit PIN Akses
            </label>
            <input
              type="password"
              maxLength={6}
              autoFocus
              disabled={loading}
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setErrorMessage(null);
              }}
              className="w-full text-center tracking-widest text-2xl py-3 border-2 rounded-xl font-bold focus:border-[#00c48c] focus:outline-none disabled:bg-slate-100"
            />
            {errorMessage && (
              <p className="text-xs text-rose-500 font-medium mt-2 animate-shake">
                {errorMessage}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full py-3 bg-gradient-to-r from-[#00c48c] to-[#00a877] hover:brightness-105 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-98 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi...
              </>
            ) : (
              <>
                Buka Portal <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
