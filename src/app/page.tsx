import Link from 'next/link';
import { Star, Smartphone, ShieldCheck, QrCode, ArrowRight, Store } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col justify-between relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[380px] bg-gradient-to-r from-sky-300/20 via-cyan-200/20 to-blue-300/15 blur-3xl -z-10 pointer-events-none rounded-full" />
      <div className="absolute -top-24 right-0 w-[350px] h-[350px] bg-cyan-200/20 blur-3xl -z-10 pointer-events-none rounded-full" />
      <div className="absolute -top-24 left-0 w-[350px] h-[350px] bg-sky-200/20 blur-3xl -z-10 pointer-events-none rounded-full" />

      {/* Navbar */}
      <header className="px-6 py-5 border-b border-slate-100/90 backdrop-blur-md bg-white/80 sticky top-0 z-20 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <img
            src="/bintang-review-logo.jpeg"
            alt="Bintang Review"
            className="w-10 h-10 rounded-xl object-contain border border-slate-100 shadow-sm shrink-0"
          />
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight leading-none text-slate-900">
              Bintang<span className="text-[#00a3dc]">Review</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Smart NFC & Review Engine</span>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#00a3dc] to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white transition shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5" />
            Login Portal
          </Link>
          <Link
            href="/admin"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95"
          >
            Super Admin
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-200/70 text-slate-700 text-xs font-semibold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#00a3dc] to-cyan-400" />
          <Smartphone className="w-3.5 h-3.5 text-[#00a3dc]" /> Solusi Hybrid Smart Akrilik NFC & QR Dinamis
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-slate-900">
          Otomasi Ulasan{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00a3dc] via-sky-500 to-blue-600">
            Bintang 5
          </span>{' '}
          Google Maps untuk Kafe & Bisnis Lokal
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Pelanggan cukup tap meja dengan smartphone. Ulasan positif langsung mengalir ke Google Maps, ulasan negatif disaring secara privat ke WhatsApp manajemen.
        </p>

        {/* Hero Action Buttons - Login is Primary */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-8 py-4 bg-gradient-to-r from-[#00a3dc] via-sky-500 to-blue-600 hover:opacity-95 text-white font-black rounded-2xl flex items-center gap-2.5 shadow-xl shadow-sky-500/25 hover:shadow-cyan-500/30 transition active:scale-95 text-base group"
          >
            <Store className="w-5 h-5 text-white" />
            <span>Masuk ke Portal Owner</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/r/kopi-senja"
            target="_blank"
            className="px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-slate-900/15 transition active:scale-95 text-sm"
          >
            <Smartphone className="w-4 h-4 text-sky-400" />
            <span>Simulasi Tap Pelanggan (/r/kopi-senja)</span>
          </Link>
        </div>
      </div>

      {/* 3 Pillars Showcase with Brand Style Cards */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
        <div className="bg-white border border-slate-100 hover:border-sky-300/80 p-6 rounded-3xl space-y-3 transition duration-300 shadow-xl shadow-slate-100/70 hover:shadow-2xl hover:shadow-sky-500/5 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-50 to-cyan-50 text-[#00a3dc] flex items-center justify-center border border-sky-200/60 shadow-sm">
            <Star className="w-6 h-6 fill-[#00a3dc]" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-slate-950">Smart Review Funnel</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Rating bintang 4–5 langsung diteruskan ke ulasan Google Maps untuk mendongkrak reputasi dan local SEO kafe Anda.
          </p>
        </div>

        <div className="bg-white border border-slate-100 hover:border-cyan-300/80 p-6 rounded-3xl space-y-3 transition duration-300 shadow-xl shadow-slate-100/70 hover:shadow-2xl hover:shadow-cyan-500/5 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-50 to-sky-50 text-[#0284c7] flex items-center justify-center border border-cyan-200/60 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-slate-950">Filter Ulasan Negatif</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Keluhan bintang 1–3 diamankan langsung ke WhatsApp manajer atau database internal sebelum sampai ke publik.
          </p>
        </div>

        <div className="bg-white border border-slate-100 hover:border-blue-300/80 p-6 rounded-3xl space-y-3 transition duration-300 shadow-xl shadow-slate-100/70 hover:shadow-2xl hover:shadow-blue-500/5 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50 text-[#0369a1] flex items-center justify-center border border-blue-200/60 shadow-sm">
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
