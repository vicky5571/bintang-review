import { notFound, redirect } from 'next/navigation';
import { dataStore } from '@/lib/store';
import { FunnelRating } from '@/components/FunnelRating';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CustomerTapPage({ params }: PageProps) {
  const { slug } = await params;
  const venue = await dataStore.getVenueBySlug(slug);

  if (!venue || !venue.is_active) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-md text-center">
          <div className="text-4xl mb-3">☕</div>
          <h1 className="text-lg font-bold text-slate-800">Layanan Sedang Diperbarui</h1>
          <p className="text-sm text-slate-500 mt-1">
            Silakan hubungi kasir atau staf cafe untuk informasi lebih lanjut.
          </p>
        </div>
      </main>
    );
  }

  // 1-Click Direct Google Bypass Mode
  if (venue.redirect_mode === 'direct_google') {
    // Log direct redirect
    await dataStore.logScan({
      venue_id: venue.id,
      action_taken: 'direct_redirect',
      device_type: 'Mobile',
    });
    redirect(venue.google_review_url);
  }

  // Smart Funnel Mode
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50/50 to-slate-100 flex flex-col justify-center px-4 py-12">
      <FunnelRating venue={venue} />
      <footer className="text-center mt-12 text-xs text-slate-400">
        Didukung oleh <span className="font-semibold text-slate-600">Bintang Review</span>
      </footer>
    </main>
  );
}
