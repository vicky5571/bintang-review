import { notFound, redirect } from 'next/navigation';
import { dataStore } from '@/lib/store';
import { FunnelRating } from '@/components/FunnelRating';
import { Coffee, Box } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CustomerTapPage({ params }: PageProps) {
  const { slug } = await params;
  const venue = await dataStore.getVenueBySlug(slug);

  if (!venue || !venue.is_active) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-3">
            <Coffee className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-800">Layanan Sedang Diperbarui</h1>
          <p className="text-sm text-slate-500 mt-1">
            Silakan hubungi kasir atau staf cafe untuk informasi lebih lanjut.
          </p>
        </div>
      </main>
    );
  }

  // Unconfigured Stock QR Stand (Belum Laku / Menunggu Aktivasi Klien)
  if (!venue.google_review_url || venue.google_review_url.trim() === '') {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="max-w-md w-full bg-white p-7 sm:p-8 rounded-3xl shadow-lg border border-slate-200/80 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto shadow-xs border border-amber-200/80">
            <Box className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Stok Stand Akrilik Siap Pakai
            </span>
            <h1 className="text-xl font-black text-slate-900 pt-1 tracking-tight">
              QR Code Belum Dihubungkan
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Unit stand akrilik ini adalah stok fisik siap pakai dan belum dihubungkan ke link Google Review kafe/toko Anda.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 text-left space-y-1.5 font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Kode Stand:</span>
              <span className="font-bold text-slate-800">/r/{venue.slug}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Label Unit:</span>
              <span className="font-semibold text-slate-700 truncate max-w-[200px]">{venue.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Status:</span>
              <span className="text-amber-600 font-bold text-[11px]">Menunggu Pembeli / Aktivasi</span>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <a
              href={`/portal/${venue.slug}`}
              className="inline-flex items-center justify-center w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition active:scale-[0.98]"
            >
              Aktivasi di Portal Pemilik
            </a>
            <p className="text-[10px] text-slate-400">
              Admin atau Marketing Specialist dapat mengisi URL kapan saja melalui dashboard admin.
            </p>
          </div>
        </div>

        <footer className="text-center mt-8 text-xs text-slate-400">
          Didukung oleh <span className="font-semibold text-slate-700">Bintang Review</span>
        </footer>
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
    <main className="min-h-screen bg-slate-50/50 flex flex-col justify-center px-4 py-12">
      <FunnelRating venue={venue} />
      <footer className="text-center mt-12 text-xs text-slate-400">
        Didukung oleh <span className="font-semibold text-slate-700">Bintang Review</span>
      </footer>
    </main>
  );
}
