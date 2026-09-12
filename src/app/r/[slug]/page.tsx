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

  // Unconfigured Stock QR Stand (Belum Laku / Menunggu Aktivasi Klien)
  if (!venue.google_review_url || venue.google_review_url.trim() === '') {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[350px] bg-gradient-to-r from-lime-200/30 via-emerald-200/20 to-cyan-200/30 blur-3xl -z-10 pointer-events-none rounded-full" />
        <div className="max-w-md w-full bg-white p-7 sm:p-8 rounded-3xl shadow-xl border border-slate-100 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-100 to-amber-50 text-amber-600 flex items-center justify-center mx-auto text-3xl shadow-sm border border-amber-200/60">
            📦
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
              className="inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-[#84cc16] via-[#10b981] to-[#06b6d4] text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:opacity-95 transition active:scale-[0.98]"
            >
              Aktivasi di Portal Pemilik
            </a>
            <p className="text-[10px] text-slate-400">
              Admin atau Marketing Specialist dapat mengisi URL kapan saja melalui dashboard admin.
            </p>
          </div>
        </div>

        <footer className="text-center mt-8 text-xs text-slate-400">
          Didukung oleh{' '}
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#84cc16] to-[#06b6d4]">
            Bintang Review
          </span>
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
