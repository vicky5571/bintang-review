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
    <main className="min-h-screen bg-white relative overflow-hidden flex flex-col justify-center px-4 py-12">
      {/* Background Soft Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[350px] bg-gradient-to-r from-lime-200/25 via-emerald-200/15 to-cyan-200/25 blur-3xl -z-10 pointer-events-none rounded-full" />

      <FunnelRating venue={venue} />
      <footer className="text-center mt-12 text-xs text-slate-400">
        Didukung oleh{' '}
        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#84cc16] to-[#06b6d4]">
          Bintang Review
        </span>
      </footer>
    </main>
  );
}
