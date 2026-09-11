import Link from 'next/link';
import { Star, Smartphone, ShieldCheck, QrCode, ArrowRight, Store } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col justify-between relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-gradient-to-r from-lime-300/15 via-emerald-300/15 to-cyan-300/20 blur-3xl -z-10 pointer-events-none rounded-full" />
      <div className="absolute -top-24 right-0 w-[350px] h-[350px] bg-cyan-200/20 blur-3xl -z-10 pointer-events-none rounded-full" />
      <div className="absolute -top-24 left-0 w-[350px] h-[350px] bg-lime-200/20 blur-3xl -z-10 pointer-events-none rounded-full" />

      {/* Navbar */}
      <header className="px-6 py-5 border-b border-slate-100/90 backdrop-blur-md bg-white/80 sticky top-0 z-20 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#84cc16] via-[#10b981] to-[#06b6d4] text-white flex items-center justify-center font-black shadow-md shadow-lime-500/20">
            <Star className="w-5 h-5 fill-white text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight leading-none text-slate-900">
              Bintang<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#84cc16] to-[#06b6d4]">Review</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Smart NFC & Review Engine</span>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm active:scale-95"
          >
            Super Admin
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-lime-50 to-cyan-50 border border-emerald-200/60 text-slate-700 text-xs font-semibold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#84cc16] to-[#06b6d4]" />
          <Smartphone className="w-3.5 h-3.5 text-[#10b981]" /> Solusi Hybrid Smart Akrilik NFC & QR Dinamis
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-slate-900">
          Otomasi Ulasan{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#84cc16] via-[#10b981] to-[#06b6d4]">
            Bintang 5
          </span>{' '}
          Google Maps untuk Kafe & Bisnis Lokal
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Pelanggan cukup tap meja dengan smartphone. Ulasan positif langsung mengalir ke Google Maps, ulasan negatif disaring secara privat ke WhatsApp manajemen.
        </p>

        {/* Demo Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/r/kopi-senja"
            target="_blank"
            className="px-6 py-3.5 bg-gradient-to-r from-[#84cc16] via-[#10b981] to-[#06b6d4] hover:opacity-95 text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-cyan-500/25 transition active:scale-95 text-sm"
          >
            <Smartphone className="w-4 h-4" /> Simulasi Tap Pelanggan (/r/kopi-senja)
          </Link>

          <Link
            href="/portal/kopi-senja"
            target="_blank"
            className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl flex items-center gap-2 border border-slate-200 shadow-sm transition active:scale-95 text-sm"
          >
            <Store className="w-4 h-4 text-[#06b6d4]" /> Buka Owner Portal (PIN: 1234)
          </Link>
        </div>
      </div>

      {/* 3 Pillars Showcase with Voney Style Cards */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
        <div className="bg-white border border-slate-100 hover:border-lime-300/80 p-6 rounded-3xl space-y-3 transition duration-300 shadow-xl shadow-slate-100/70 hover:shadow-2xl hover:shadow-lime-500/5 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-50 to-emerald-50 text-[#84cc16] flex items-center justify-center border border-lime-200/60 shadow-sm">
            <Star className="w-6 h-6 fill-[#84cc16]" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-slate-950">Smart Review Funnel</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Rating bintang 4–5 langsung diteruskan ke ulasan Google Maps untuk mendongkrak reputasi dan local SEO kafe Anda.
          </p>
        </div>

        <div className="bg-white border border-slate-100 hover:border-emerald-300/80 p-6 rounded-3xl space-y-3 transition duration-300 shadow-xl shadow-slate-100/70 hover:shadow-2xl hover:shadow-emerald-500/5 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 text-[#10b981] flex items-center justify-center border border-emerald-200/60 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-slate-950">Filter Ulasan Negatif</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Keluhan bintang 1–3 diamankan langsung ke WhatsApp manajer atau database internal sebelum sampai ke publik.
          </p>
        </div>

        <div className="bg-white border border-slate-100 hover:border-cyan-300/80 p-6 rounded-3xl space-y-3 transition duration-300 shadow-xl shadow-slate-100/70 hover:shadow-2xl hover:shadow-cyan-500/5 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-50 to-teal-50 text-[#06b6d4] flex items-center justify-center border border-cyan-200/60 shadow-sm">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-slate-950">Hardware Seumur Hidup</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Stand akrilik menggunakan tautan dinamis cloud. Ubah link Google atau nomor tujuan kapan pun tanpa repot mencetak ulang.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-100 text-center text-xs text-slate-400 bg-slate-50/50">
        © 2026 Bintang Review. Solusi Reputasi & Smart NFC Bisnis Indonesia.
      </footer>
    </main>
  );
}
