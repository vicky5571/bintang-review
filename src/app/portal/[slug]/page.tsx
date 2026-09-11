'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Venue, VenueAnalytics, FeedbackMessage } from '@/lib/types';
import { OwnerPinModal } from '@/components/OwnerPinModal';
import { OwnerDashboardView } from '@/components/OwnerDashboardView';

export default function OwnerPortalPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [venueName, setVenueName] = useState<string>('');
  const [venue, setVenue] = useState<Venue | null>(null);
  const [analytics, setAnalytics] = useState<VenueAnalytics | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackMessage[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadPublicInfo() {
      if (!slug) return;
      try {
        const res = await fetch(`/api/portal/verify?slug=${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          setVenueName(data.name || slug);
        } else if (res.status === 404) {
          setNotFound(true);
        }
      } catch (err) {
        console.error('Failed to load venue public info:', err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadPublicInfo();
  }, [slug]);

  const handleVerify = async (pin: string) => {
    try {
      const res = await fetch('/api/portal/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug, pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'PIN salah' };
      }

      setVenue(data.venue);
      setAnalytics(data.analytics);
      setFeedbacks(data.feedbacks || []);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Koneksi ke server gagal. Coba lagi.' };
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Memuat portal...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Venue tidak ditemukan atau tidak aktif.
      </div>
    );
  }

  if (!isAuthenticated || !venue || !analytics) {
    return (
      <OwnerPinModal
        venueName={venueName || slug}
        onVerify={handleVerify}
      />
    );
  }

  return (
    <OwnerDashboardView
      venue={venue}
      analytics={analytics}
      feedbacks={feedbacks}
    />
  );
}
