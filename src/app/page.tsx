import Link from 'next/link';
import { Star, Smartphone, ShieldCheck, QrCode, ArrowRight, BarChart3, Store } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Navbar */}
      <header className="px-6 py-6 border-b border-slate-800 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
            <Star className="w-5 h-5 fill-slate-950" />
          </div>
          <span className="font-black text-xl tracking-tight">Bintang Review</span>
        </div>

        <nav className="flex items-center gap-3">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
          >
            Super Admin
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          <Smartphone className="w-3.5 h-3.5" /> Solusi Hybrid Smart Akrilik NFC & QR Dinamis
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
          Otomasi Ulasan <span className="text-amber-400">Bintang 5</span> Google Maps untuk Kafe & Bisnis Anda
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          Pelanggan cukup tap meja dengan smartphone. Ulasan positif langsung mengalir ke Google Maps, ulasan negatif diamankan secara privat ke WhatsApp manajemen.
        </p>

        {/* Demo Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/r/kopi-senja"
            target="_blank"
            className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95 text-sm"
          >
            <Smartphone className="w-4 h-4" /> Coba Simulasi Tap Pelanggan (/r/kopi-senja)
          </Link>

          <Link
            href="/portal/kopi-senja"
            target="_blank"
            className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl flex items-center gap-2 border border-slate-700 transition active:scale-95 text-sm"
          >
            <Store className="w-4 h-4" /> Buka Owner Portal (PIN: 1234)
          </Link>
        </div>
      </div>

      {/* 3 Pillars Showcase */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
        <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
          <h3 className="font-bold text-lg text-white">Smart Review Funnel</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Rating bintang 4–5 langsung diteruskan ke ulasan Google Maps untuk mendongkrak peringkat lokal SEO.
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-white">Filter Ulasan Negatif</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Keluhan bintang 1–3 dialihkan langsung ke WhatsApp manajer atau database privat, menjaga rating publik tetap tinggi.
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-white">Hardware Seumur Hidup</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Stand akrilik menggunakan link dinamis. Ganti link Google atau nomor telepon kapan saja tanpa mencetak ulang akrilik.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-800 text-center text-xs text-slate-500">
        © 2026 Bintang Review. Solusi Reputasi & Smart NFC Bisnis Indonesia.
      </footer>
    </main>
  );
}
