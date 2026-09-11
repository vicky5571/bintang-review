'use client';

import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

export function verifyOwnerPin(inputPin: string, correctPin: string): boolean {
  return inputPin.trim() === correctPin.trim();
}

interface OwnerPinModalProps {
  venueName: string;
  correctPin: string;
  onSuccess: () => void;
}

export function OwnerPinModal({ venueName, correctPin, onSuccess }: OwnerPinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOwnerPin(pin, correctPin)) {
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Owner Portal</h2>
        <p className="text-xs text-slate-500 mt-1">{venueName}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">
              Masukkan 4-Digit PIN Akses
            </label>
            <input
              type="password"
              maxLength={6}
              autoFocus
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              className="w-full text-center tracking-widest text-2xl py-3 border-2 rounded-xl font-bold focus:border-amber-500 focus:outline-none"
            />
            {error && <p className="text-xs text-rose-500 font-medium mt-2">PIN salah, silakan coba lagi</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            Buka Portal <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
