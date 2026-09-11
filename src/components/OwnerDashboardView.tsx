'use client';

import React from 'react';
import { Venue, VenueAnalytics, FeedbackMessage } from '@/lib/types';
import { Star, MessageCircle, BarChart3, ShieldCheck, PhoneCall } from 'lucide-react';

interface OwnerDashboardViewProps {
  venue: Venue;
  analytics: VenueAnalytics;
  feedbacks: FeedbackMessage[];
}

export function OwnerDashboardView({ venue, analytics, feedbacks }: OwnerDashboardViewProps) {
  const supportWaUrl = `https://wa.me/628123456789?text=${encodeURIComponent(
    `Halo Tim Bintang Review, saya owner ${venue.name} (slug: ${venue.slug}) ingin meminta bantuan layanan:`
  )}`;

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-10 px-4 py-4 sm:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {venue.logo_url ? (
            <img src={venue.logo_url} alt={venue.name} className="w-10 h-10 rounded-2xl object-cover border border-slate-100 shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#84cc16] via-[#10b981] to-[#06b6d4] text-white flex items-center justify-center font-black shadow-sm">
              {venue.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-lg font-black text-slate-900">{venue.name}</h1>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Stand Akrilik Aktif
            </span>
          </div>
        </div>
        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium border border-slate-200/60">
          Read-Only Portal
        </span>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 mt-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Tap & Scan</span>
              <BarChart3 className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-3xl font-black text-slate-900">{analytics.total_scans}</div>
            <p className="text-xs text-slate-400 mt-1">Hari ini: +{analytics.today_scans} tap</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Tingkat Kepuasan</span>
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#84cc16] to-[#06b6d4]">
              {analytics.satisfaction_rate}%
            </div>
            <p className="text-xs text-slate-400 mt-1">Rating 4-5 bintang langsung ke Google</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Ulasan Negatif Tersaring</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-600">{analytics.negative_count}</div>
            <p className="text-xs text-slate-400 mt-1">Berhasil ditampung privat sebelum ke publik</p>
          </div>
        </div>

        {/* Feedback Inbox */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-slate-800">Inbox Masukan Pelanggan (Bintang 1 - 3)</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">{feedbacks.length} masukan</span>
          </div>

          <div className="divide-y divide-slate-100">
            {feedbacks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                🎉 Belum ada keluhan atau ulasan negatif. Pelayanan Anda luar biasa!
              </div>
            ) : (
              feedbacks.map((item) => (
                <div key={item.id} className="p-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {item.customer_name || 'Pelanggan Anonim'}
                      </span>
                      {item.table_number && (
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-mono">
                          Meja {item.table_number}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                    "{item.message}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Done-For-You Floating Concierge Bar */}
      <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-20">
        <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-slate-800">
          <div className="text-xs">
            <p className="font-semibold">Butuh bantuan atau ingin ubah link Google?</p>
            <p className="text-slate-400 text-[11px]">Tim concierge Bintang Review siap membantu.</p>
          </div>
          <a
            href={supportWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#84cc16] via-[#10b981] to-[#06b6d4] hover:opacity-95 active:scale-95 text-white text-xs font-bold rounded-xl transition whitespace-nowrap shadow-md shadow-emerald-500/20"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Chat Concierge
          </a>
        </div>
      </div>
    </div>
  );
}
