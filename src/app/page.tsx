import Link from 'next/link';
import { Star, Smartphone, ShieldCheck, QrCode, ArrowRight, Store } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0f172a] text-white flex flex-col justify-between">
      {/* Navbar */}
      <header className="px-6 py-6 border-b border-slate-800/80 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00c48c] via-[#10b981] to-[#44ebcf] text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
            <Star className="w-5 h-5 fill-slate-950 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight leading-none text-white">
              Bintang<span className="text-[#00c48c]">Review</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Smart NFC & Review Engine</span>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00c48c] hover:bg-[#00a877] text-slate-950 transition shadow-lg shadow-emerald-500/20"
          >
            Super Admin
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00c48c]/10 border border-[#00c48c]/25 text-[#00c48c] text-xs font-semibold">
          <Smartphone className="w-3.5 h-3.5" /> Solusi Hybrid Smart Akrilik NFC & QR Dinamis
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
          Otomasi Ulasan{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c48c] via-[#44ebcf] to-[#10b981]">
            Bintang 5
          </span>{' '}
          Google Maps untuk Kafe & Bisnis Lokal
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          Pelanggan cukup tap meja dengan smartphone. Ulasan positif langsung mengalir ke Google Maps, ulasan negatif disaring secara privat ke WhatsApp manajemen.
        </p>

        {/* Demo Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/r/kopi-senja"
            target="_blank"
            className="px-6 py-3.5 bg-gradient-to-r from-[#00c48c] to-[#00a877] hover:brightness-110 text-slate-950 font-bold rounded-2xl flex items-center gap-2 shadow-xl shadow-emerald-500/25 transition active:scale-95 text-sm"
          >
            <Smartphone className="w-4 h-4" /> Simulasi Tap Pelanggan (/r/kopi-senja)
          </Link>

          <Link
            href="/portal/kopi-senja"
            target="_blank"
            className="px-6 py-3.5 bg-slate-800/90 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center gap-2 border border-slate-700/80 transition active:scale-95 text-sm"
          >
            <Store className="w-4 h-4 text-[#00c48c]" /> Buka Owner Portal (PIN: 1234)
          </Link>
        </div>
      </div>

      {/* 3 Pillars Showcase with Voney Style Cards */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
        <div className="bg-slate-800/40 border border-slate-800 hover:border-emerald-500/30 p-6 rounded-3xl space-y-3 transition duration-300">
          <div className="w-12 h-12 rounded-2xl bg-[#00c48c]/10 text-[#00c48c] flex items-center justify-center border border-[#00c48c]/20">
            <Star className="w-6 h-6 fill-[#00c48c]" />
          </div>
          <h3 className="font-bold text-lg text-white">Smart Review Funnel</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Rating bintang 4–5 langsung diteruskan ke ulasan Google Maps untuk mendongkrak reputasi dan local SEO kafe Anda.
          </p>
        </div>

        <div className="bg-slate-800/40 border border-slate-800 hover:border-emerald-500/30 p-6 rounded-3xl space-y-3 transition duration-300">
          <div className="w-12 h-12 rounded-2xl bg-[#00c48c]/10 text-[#00c48c] flex items-center justify-center border border-[#00c48c]/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-white">Filter Ulasan Negatif</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Keluhan bintang 1–3 diamankan langsung ke WhatsApp manajer atau database internal sebelum sampai ke publik.
          </p>
        </div>

        <div className="bg-slate-800/40 border border-slate-800 hover:border-emerald-500/30 p-6 rounded-3xl space-y-3 transition duration-300">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-white">Hardware Seumur Hidup</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Stand akrilik menggunakan tautan dinamis cloud. Ubah link Google atau nomor tujuan kapan pun tanpa repot mencetak ulang.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
        © 2026 Bintang Review. Solusi Reputasi & Smart NFC Bisnis Indonesia.
      </footer>
    </main>
  );
}
