'use client';

import React from 'react';
import { UnifiedLoginCard } from './UnifiedLoginCard';

interface AdminLoginModalProps {
  onSuccess: () => void;
}

export function AdminLoginModal({ onSuccess }: AdminLoginModalProps) {
  return (
    <div className="min-h-screen bg-slate-50/70 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-gradient-to-r from-lime-200/25 via-emerald-200/20 to-cyan-200/25 blur-3xl -z-10 pointer-events-none rounded-full" />

      <UnifiedLoginCard onSuccess={() => onSuccess()} />
    </div>
  );
}

