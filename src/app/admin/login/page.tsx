'use client';

import React from 'react';
import { UnifiedLoginCard } from '@/components/UnifiedLoginCard';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50/70 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-blue-200/20 via-cyan-200/20 to-slate-200/30 blur-3xl -z-10 pointer-events-none rounded-full" />

      <UnifiedLoginCard defaultRole="marketing_specialist" redirectUrl="/admin" />
    </div>
  );
}

