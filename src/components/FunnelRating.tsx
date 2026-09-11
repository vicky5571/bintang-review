'use client';

import React, { useState } from 'react';
import { Star, Sparkles } from 'lucide-react';
import { Venue } from '@/lib/types';
import { PrivateFeedbackModal } from './PrivateFeedbackModal';

interface FunnelRatingProps {
  venue: Venue;
}

export function FunnelRating({ venue }: FunnelRatingProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(false);

  const handleRatingSelect = async (stars: number) => {
    setSelectedRating(stars);

    // Haptic vibration feedback on mobile phones
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 60, 40]);
    }

    if (stars >= 4) {
      setIsRedirecting(true);
      try {
        // Log positive scan to analytics
        await fetch('/api/tap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            venueId: venue.id,
            actionTaken: 'positive_review',
            ratingSelected: stars,
          }),
        });
      } catch (e) {
        console.error(e);
      }

      // Smooth auto forward to Google Maps Review
      setTimeout(() => {
        window.location.replace(venue.google_review_url);
      }, 900);
    } else {
      // 1 to 3 stars: Open private feedback modal
      setIsPrivateModalOpen(true);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center">
      {/* Brand Header */}
      <div className="flex flex-col items-center">
        {venue.logo_url ? (
          <img
            src={venue.logo_url}
            alt={venue.name}
            className="w-20 h-20 rounded-3xl object-cover shadow-xl border-2 border-white mb-4"
          />
        ) : (
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#84cc16] via-[#10b981] to-[#06b6d4] text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-lime-500/20 mb-4">
            {venue.name.charAt(0)}
          </div>
        )}
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{venue.name}</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">
          Bagaimana pengalaman Anda bersama kami hari ini?
        </p>
      </div>

      {/* Interactive Stars */}
      <div className="mt-8 bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/60 border border-slate-100">
        <div className="flex justify-center items-center gap-2 sm:gap-3 py-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = (hoverRating || selectedRating || 0) >= star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingSelect(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 sm:p-2 transition transform hover:scale-125 active:scale-95 focus:outline-none"
              >
                <Star
                  className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                    isFilled ? 'fill-amber-400 text-amber-400 filter drop-shadow' : 'text-slate-200'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <p className="text-xs font-medium text-slate-400 mt-4">
          Ketuk bintang untuk menilai (1 - 5)
        </p>
      </div>

      {/* 4-5 Stars Thank You Micro-Modal */}
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl border border-slate-100">
            <div className="w-14 h-14 bg-gradient-to-br from-lime-50 to-cyan-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#10b981] border border-emerald-200/60 shadow-sm">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Luar Biasa!</h3>
            <p className="text-xs text-slate-500 mt-2">
              Terima kasih atas penilaian bintang 5 Anda. Mengalihkan ke Google Maps Review...
            </p>
          </div>
        </div>
      )}

      {/* 1-3 Stars Private Feedback Modal */}
      {selectedRating && selectedRating <= 3 && (
        <PrivateFeedbackModal
          venue={venue}
          rating={selectedRating}
          isOpen={isPrivateModalOpen}
          onClose={() => setIsPrivateModalOpen(false)}
        />
      )}
    </div>
  );
}
