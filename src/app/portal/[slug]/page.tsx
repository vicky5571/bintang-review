'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Venue, VenueAnalytics, FeedbackMessage } from '@/lib/types';
import { dataStore } from '@/lib/store';
import { OwnerPinModal } from '@/components/OwnerPinModal';
import { OwnerDashboardView } from '@/components/OwnerDashboardView';

export default function OwnerPortalPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [analytics, setAnalytics] = useState<VenueAnalytics | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackMessage[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      const v = await dataStore.getVenueBySlug(slug);
      if (v) {
        setVenue(v);
        const an = await dataStore.getVenueAnalytics(v.id);
        setAnalytics(an);
        const fb = await dataStore.listFeedback(v.id);
        setFeedbacks(fb);
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Memuat portal...</div>;
  }

  if (!venue) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Venue tidak ditemukan.</div>;
  }

  if (!isAuthenticated) {
    return (
      <OwnerPinModal
        venueName={venue.name}
        correctPin={venue.owner_access_pin}
        onSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <OwnerDashboardView
      venue={venue}
      analytics={analytics!}
      feedbacks={feedbacks}
    />
  );
}
