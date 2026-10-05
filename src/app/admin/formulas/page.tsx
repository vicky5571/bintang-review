'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthSession, MarketingSpecialistSummary } from '@/lib/types';
import { calculateProfitDistribution, calculateMonthlyNetProfitWithServerCost } from '@/lib/profitSharing';
import {
  ArrowLeft,
  Calculator,
  ShieldCheck,
  DollarSign,
  Car,
  UserCheck,
  Building2,
  PieChart,
  Scale,
  Sparkles,
  Info,
  CheckCircle2,
  RefreshCw,
  Users,
  Store,
  Layers,
  Plus,
  Trash2,
  AlertCircle,
  Equal,
} from 'lucide-react';
import { AdminLoginModal } from '@/components/AdminLoginModal';

interface SimBearer {
  id: string;
  name: string;
  amount: number;
  type: 'marketing' | 'platform';
  specialist_id?: string | null;
}

const DEFAULT_SPECIALISTS: MarketingSpecialistSummary[] = [
  {
    id: 'specialist-budi-123',
    name: 'Budi Santoso (Marketing Specialist)',
    phone_whatsapp: '081234567890',
    email: 'budi@gmail.com',
    access_pin: '1234',
    commission_type: 'percentage',
    commission_rate: 20,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    total_venues: 0,
    total_revenue: 0,
    earned_commission: 0,
  },
  {
    id: 'founder-vicky-dev',
    name: 'Vicky Galih Pamungkas (Co-Founder & Specialist)',
    phone_whatsapp: '081299990001',
    email: 'vicky@bintangreview.com',
    access_pin: '1234',
    commission_type: 'percentage',
    commission_rate: 20,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    total_venues: 0,
    total_revenue: 0,
    earned_commission: 0,
  },
  {
    id: 'founder-natan-dev',
    name: 'Natan Setyo Agung (Co-Founder & Specialist)',
    phone_whatsapp: '081299990002',
    email: 'natan@bintangreview.com',
    access_pin: '1234',
    commission_type: 'percentage',
    commission_rate: 20,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    total_venues: 0,
    total_revenue: 0,
    earned_commission: 0,
  },
];

export default function AdminFormulasPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Marketing Specialists from DB / API
  const [marketingSpecialists, setMarketingSpecialists] = useState<MarketingSpecialistSummary[]>(DEFAULT_SPECIALISTS);
  const [isLoadingSpecialists, setIsLoadingSpecialists] = useState(false);
  const [simSingleSpecialistId, setSimSingleSpecialistId] = useState<string>('founder-vicky-dev');
  const [simExternalSpecialistId, setSimExternalSpecialistId] = useState<string>('specialist-budi-123');

  // Simulator State: Per-Venue Deal
  const [simDealAmount, setSimDealAmount] = useState<number>(599000);
  const [simHpp, setSimHpp] = useState<number>(150000);
  const [simCloser, setSimCloser] = useState<'vicky' | 'natan' | 'external'>('vicky');
  const [simHppMode, setSimHppMode] = useState<'single_marketing' | 'single_platform' | 'custom_split'>('single_marketing');
  const [simTransport, setSimTransport] = useState<number>(20000);

  // Multi-Bearer HPP State (Custom nominal rupiah dari tabel Marketing Specialist)
  const [simBearers, setSimBearers] = useState<SimBearer[]>([
    {
      id: 'bearer-1',
      name: 'Vicky Galih Pamungkas (Co-Founder & Specialist)',
      amount: 90000,
      type: 'marketing',
      specialist_id: 'founder-vicky-dev',
    },
    {
      id: 'bearer-2',
      name: 'Natan Setyo Agung (Co-Founder & Specialist)',
      amount: 60000,
      type: 'marketing',
      specialist_id: 'founder-natan-dev',
    },
  ]);

  // Simulator State: Monthly Equity Dividend
  const [simMonthlyRevenue, setSimMonthlyRevenue] = useState<number>(15000000);
  const [simMonthlyHpp, setSimMonthlyHpp] = useState<number>(3750000);
  const [simServerCost, setSimServerCost] = useState<number>(650000);

  const fetchSpecialists = async () => {
    setIsLoadingSpecialists(true);
    try {
      const res = await fetch('/api/admin/marketing-specialists');
      if (res.ok) {
        const data = await res.json();
        const list: MarketingSpecialistSummary[] = data.marketingSpecialists || [];
        if (list.length > 0) {
          setMarketingSpecialists(list);
          // Sync existing bearers if any specialist_id matches
          setSimBearers((prev) =>
            prev.map((b) => {
              if (b.type === 'platform') return b;
              const matched = list.find((m) => m.id === b.specialist_id);
              if (matched) return { ...b, name: matched.name };
              return b;
            })
          );
        }
      }
    } catch (err) {
      console.error('Gagal memuat tabel marketing specialist:', err);
    } finally {
      setIsLoadingSpecialists(false);
    }
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        if (data.user.role !== 'super_admin') {
          window.location.href = '/admin';
          return;
        }
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        fetchSpecialists();
        return;
      }

      const resAdmin = await fetch('/api/admin/auth');
      const dataAdmin = await resAdmin.json();
      if (dataAdmin.authenticated) {
        setIsAuthenticated(true);
        setCurrentUser(dataAdmin.user || { role: 'super_admin', name: 'Super Admin', authenticated: true });
        fetchSpecialists();
        return;
      }

      setIsAuthenticated(false);
    } catch (err) {
      console.error('Error verifying auth:', err);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Multi-Bearer Management Handlers (Mengambil dari Tabel Marketing Specialist)
  const handleAddBearer = () => {
    // Ambil marketing specialist dari tabel yang belum terpilih
    const available = marketingSpecialists.find(
      (m) => !simBearers.some((b) => b.type === 'marketing' && b.specialist_id === m.id)
    ) || marketingSpecialists[0];

    setSimBearers((prev) => [
      ...prev,
      {
        id: `bearer-${Date.now()}`,
        name: available?.name || `Marketing Specialist ${prev.length + 1}`,
        amount: 0,
        type: 'marketing',
        specialist_id: available?.id || null,
      },
    ]);
  };

  const handleRemoveBearer = (index: number) => {
    if (simBearers.length <= 1) return;
    setSimBearers(simBearers.filter((_, idx) => idx !== index));
  };

  const handleBearerAmountChange = (index: number, val: number) => {
    const updated = [...simBearers];
    updated[index].amount = Math.max(0, val);
    setSimBearers(updated);
  };

  const handleBearerSelectChange = (index: number, selectedValue: string) => {
    const updated = [...simBearers];
    if (selectedValue === 'platform') {
      updated[index] = {
        ...updated[index],
        type: 'platform',
        specialist_id: null,
        name: 'Platform / Agency (Kas Perusahaan)',
      };
    } else {
      const matched = marketingSpecialists.find((m) => m.id === selectedValue);
      updated[index] = {
        ...updated[index],
        type: 'marketing',
        specialist_id: selectedValue,
        name: matched?.name || 'Marketing Specialist',
      };
    }
    setSimBearers(updated);
  };

  const handleEvenSplit = () => {
    if (simBearers.length === 0 || simHpp === 0) return;
    const splitAmount = Math.floor(simHpp / simBearers.length);
    const remainder = simHpp - splitAmount * simBearers.length;
    const updated = simBearers.map((b, idx) => ({
      ...b,
      amount: idx === simBearers.length - 1 ? splitAmount + remainder : splitAmount,
    }));
    setSimBearers(updated);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium text-sm">
        Memverifikasi sesi akses Super Admin...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLoginModal
        onSuccess={(user) => {
          if (user?.role === 'super_admin') {
            setIsAuthenticated(true);
            setCurrentUser(user);
          } else {
            window.location.href = '/login';
          }
        }}
      />
    );
  }

  // Calculate live per-venue simulation using the exact codebase function
  const selectedExternal = marketingSpecialists.find((m) => m.id === simExternalSpecialistId) || marketingSpecialists[0];
  const closerName =
    simCloser === 'vicky'
      ? 'Vicky Galih Pamungkas'
      : simCloser === 'natan'
      ? 'Natan Setyo Agung'
      : selectedExternal?.name || 'Agen Eksternal';

  const singleSpecObj = marketingSpecialists.find((m) => m.id === simSingleSpecialistId) || marketingSpecialists[0];

  const totalBearersAllocated = simBearers.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const bearerDifference = simHpp - totalBearersAllocated;

  const simResult = calculateProfitDistribution({
    deal_amount: simDealAmount,
    hpp: simHpp,
    hpp_payer: simHppMode === 'single_platform' ? 'platform' : simHppMode === 'single_marketing' ? 'marketing' : 'split',
    hpp_bearers:
      simHppMode === 'custom_split'
        ? simBearers.map((b) => ({
            id: b.id,
            name: b.name,
            amount: b.amount,
            ratio: simHpp > 0 ? (b.amount / simHpp) * 100 : 0,
            type: b.type,
            specialist_id: b.specialist_id,
          }))
        : simHppMode === 'single_marketing'
        ? [
            {
              id: 'bearer-single-marketing',
              name: singleSpecObj?.name || 'Marketing Specialist',
              amount: simHpp,
              ratio: 100,
              type: 'marketing',
              specialist_id: singleSpecObj?.id || null,
            },
          ]
        : undefined,
    closing_specialist_id:
      simCloser === 'vicky'
        ? 'founder-vicky-dev'
        : simCloser === 'natan'
        ? 'founder-natan-dev'
        : selectedExternal?.id || 'external-id',
    closing_specialist_name: closerName,
    transport_fee: simTransport,
  });

  // Calculate live monthly equity dividend
  const monthlyResult = calculateMonthlyNetProfitWithServerCost({
    total_gross_revenue: simMonthlyRevenue,
    total_hpp_cost: simMonthlyHpp,
    server_operating_cost: simServerCost,
  });

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* Top Sticky Navbar */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-4 sticky top-0 z-20 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali ke Dashboard</span>
          </Link>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 flex items-center gap-2">
                Audit Rumus Keuangan Bintang Review
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified PKS
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">Transparansi Algoritma Finansial Sesuai Perjanjian Tertulis</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium hidden md:inline">
            Dokumen: <strong className="text-slate-800">PERJANJIAN_KEMITRAAN_BINTANG_REVIEW.md</strong>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        {/* Banner Legal Basis */}
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Dasar Hukum: Akta Kemitraan Founders No. 001/PKS-FOUNDERS/BR
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Formula Pembagian Hasil & Tata Kelola Keuangan
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Halaman ini merangkum seluruh rumus matematika keuangan yang diimplementasikan pada kode sumber repositori
                (<code className="text-amber-300">src/lib/profitSharing.ts</code>) dan memverifikasi kepatuhannya
                terhadap klausul tertulis antara <strong>Vicky Galih Pamungkas (51%)</strong> dan{' '}
                <strong>Natan Setyo Agung (49%)</strong> selaku Para Pendiri (Co-Founders).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 shrink-0 text-center">
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
                <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Vicky G. Pamungkas</p>
                <p className="text-xl font-black text-amber-300 mt-0.5">51%</p>
                <p className="text-[10px] text-slate-400">Project Leader & Dev</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15">
                <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Natan S. Agung</p>
                <p className="text-xl font-black text-cyan-300 mt-0.5">49%</p>
                <p className="text-[10px] text-slate-400">Co-Founder & QA/Design</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: FORMULA PER-TRANSAKSI CLOSING VENUE (PASAL 4) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-[#00a3dc] flex items-center justify-center font-bold">
                <Layers className="w-5 h-5 text-[#00a3dc]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  1. Formula Transaksi Closing Venue (Pasal 4 PKS)
                </h3>
                <p className="text-xs text-slate-500">
                  Dijalankan otomatis setiap kali venue baru didaftarkan atau dilakukan settlement
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Pasal 4 Ayat 1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1 & 2 */}
            <div className="p-4 rounded-2xl border border-slate-200/70 bg-slate-50/50 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Langkah 1 & 2</span>
              <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                Laba Kotor (Gross Profit)
                <code className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Deal - HPP
                </code>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nilai pembayaran bersih yang disepakati dengan merchant/kafe (<strong>Deal Amount</strong>) dikurangi
                dengan biaya riil modal fisik akrilik, stiker, NFC, dan cetak vendor (<strong>HPP</strong>).
              </p>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
                Gross Profit = Deal Amount - HPP
              </div>
            </div>

            {/* Step 3: Reciprocal Dev Fee */}
            <div className="p-4 rounded-2xl border border-cyan-200/80 bg-cyan-50/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider">Langkah 3</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full">
                  Timbal-Balik (Reciprocal)
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                Developer Fee Timbal-Balik (10%)
                <code className="text-xs font-mono text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">
                  10% × Gross Profit
                </code>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Tidak masuk kas sistem</strong>, melainkan dialokasikan ke founder yang <strong>tidak closing</strong> di lapangan:
              </p>
              <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside bg-white p-2.5 rounded-xl border border-cyan-100">
                <li>Deal ditutup oleh <strong>Vicky</strong> $\rightarrow$ <strong>100% hak Natan</strong></li>
                <li>Deal ditutup oleh <strong>Natan</strong> $\rightarrow$ <strong>100% hak Vicky</strong></li>
                <li>Deal melalui <strong>Agen Eksternal</strong> $\rightarrow$ <strong>50:50 antara Vicky & Natan</strong></li>
              </ul>
            </div>

            {/* Step 4: Marketing Transport */}
            <div className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/30 space-y-2">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Langkah 4</span>
              <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                Uang Transportasi Flat
                <code className="text-xs font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Rp 20.000 (Flat)
                </code>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Diberikan kepada <strong>Marketing Specialist</strong> yang menutup transaksi (<strong>Closer</strong>) jika ada pengantaran unit fisik
                (HPP &gt; 0). Jika paket perpanjangan langganan (HPP = 0), transport = Rp 0.
              </p>
              <div className="p-2.5 bg-white rounded-xl border border-amber-100 text-xs font-mono text-slate-700">
                Marketing Transport = Rp 20.000 (jika HPP fisik &gt; 0)
              </div>
            </div>

            {/* Step 5: Net Split Profit & Multi-Bearer */}
            <div className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 space-y-2">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Langkah 5 & 6</span>
              <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                Split HPP Custom & Bagi Sisa Laba
                <code className="text-xs font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Nominal Rp Dinamis
                </code>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Penanggungan modal HPP <strong>tidaklah fix 50:50</strong>, melainkan ditentukan secara <strong>custom dalam bentuk Rupiah oleh beberapa Marketing Specialist</strong> (maupun bersama Kas Platform).
              </p>
              <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside bg-white p-2.5 rounded-xl border border-emerald-100">
                <li><strong>Reimburse 100%</strong>: Modal fisik yang ditalangi dikembalikan utuh ke masing-masing Marketing Specialist.</li>
                <li><strong>Porsi Sisa Laba (Final Share)</strong>: Dibagi proporsional sesuai rasio nominal Rupiah yang disetorkan terhadap total HPP.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 2: SIMULATOR INTERAKTIF DEAL VENUE */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-indigo-200 shadow-lg shadow-indigo-100/50 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Calculator className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Simulator Interaktif Transaksi Venue (Multi-Bearer HPP)
                </h3>
                <p className="text-xs text-slate-500">
                  Simulasikan pembagian modal kustom Rupiah oleh beberapa Marketing Specialist menggunakan mesin kode <code className="text-indigo-600 font-mono">calculateProfitDistribution()</code>
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Live Interactive
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Controls */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Nilai Transaksi / Harga Paket (Deal Amount)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    step="1000"
                    value={simDealAmount}
                    onChange={(e) => setSimDealAmount(Number(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  {[70000, 299000, 599000, 999000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSimDealAmount(val)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-600"
                    >
                      {val / 1000}k
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Biaya Fisik Modal Pengadaan (HPP)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    step="1000"
                    value={simHpp}
                    onChange={(e) => {
                      const newHpp = Number(e.target.value) || 0;
                      setSimHpp(newHpp);
                    }}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  {[0, 30000, 100000, 150000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSimHpp(val)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-600"
                    >
                      {val === 0 ? '0 (Langganan)' : `${val / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3. Pihak Penutup Transaksi (Closer)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimCloser('vicky')}
                    className={`p-2 rounded-xl border text-xs font-bold transition text-left ${
                      simCloser === 'vicky'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Vicky
                    <span className="block text-[9px] font-normal text-slate-500">Dev Fee ke Natan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimCloser('natan')}
                    className={`p-2 rounded-xl border text-xs font-bold transition text-left ${
                      simCloser === 'natan'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Natan
                    <span className="block text-[9px] font-normal text-slate-500">Dev Fee ke Vicky</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimCloser('external')}
                    className={`p-2 rounded-xl border text-xs font-bold transition text-left ${
                      simCloser === 'external'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Specialist Lain
                    <span className="block text-[9px] font-normal text-slate-500">Dev Fee 50:50</span>
                  </button>
                </div>

                {simCloser === 'external' && (
                  <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <label className="block text-[10px] font-semibold text-slate-500">
                      Pilih Marketing Specialist Closer dari Tabel:
                    </label>
                    <select
                      value={simExternalSpecialistId}
                      onChange={(e) => setSimExternalSpecialistId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      {marketingSpecialists.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.phone_whatsapp ? `(${m.phone_whatsapp})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Mode Penanggung HPP */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  4. Skema Penanggung Modal HPP
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimHppMode('single_marketing')}
                    className={`p-2 rounded-xl border text-xs font-bold transition text-left ${
                      simHppMode === 'single_marketing'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    100% Specialist
                    <span className="block text-[9px] font-normal text-slate-500">Tunggal (Closer)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimHppMode('single_platform')}
                    className={`p-2 rounded-xl border text-xs font-bold transition text-left ${
                      simHppMode === 'single_platform'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    100% Kas Platform
                    <span className="block text-[9px] font-normal text-slate-500">Kas Agency</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimHppMode('custom_split')}
                    className={`p-2 rounded-xl border text-xs font-bold transition text-left ${
                      simHppMode === 'custom_split'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Custom Split Rp
                    <span className="block text-[9px] font-normal text-slate-500">Beberapa Specialist</span>
                  </button>
                </div>

                {/* Single Marketing Specialist 100% Selector */}
                {simHppMode === 'single_marketing' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 mt-2 animate-in fade-in">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Pilih Marketing Specialist Penanggung 100% Modal HPP:
                    </label>
                    <select
                      value={simSingleSpecialistId}
                      onChange={(e) => setSimSingleSpecialistId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      {marketingSpecialists.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.phone_whatsapp ? `(${m.phone_whatsapp})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500">
                      100% Modal HPP (Rp {simHpp.toLocaleString('id-ID')}) ditalangi penuh oleh specialist ini dan direimburse 100% saat pelunasan.
                    </p>
                  </div>
                )}

                {/* MULTI-BEARER CUSTOM SPLIT RUPIAH EDITOR */}
                {simHppMode === 'custom_split' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 mt-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-600" /> Rincian Modal per Penanggung (dari Tabel):
                      </span>
                      <button
                        type="button"
                        onClick={handleEvenSplit}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200 flex items-center gap-1"
                        title="Bagi rata nominal HPP secara otomatis"
                      >
                        <Equal className="w-3 h-3" /> Bagi Rata Otomatis
                      </button>
                    </div>

                    <div className="space-y-2">
                      {simBearers.map((b, idx) => {
                        const ratio = simHpp > 0 ? ((b.amount / simHpp) * 100).toFixed(1) : '0.0';
                        const isPlatform = b.type === 'platform';
                        return (
                          <div
                            key={b.id || idx}
                            className="p-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                                Penanggung #{idx + 1}
                                <span
                                  className={`ml-1 text-[9px] font-normal px-1.5 py-0.5 rounded-full ${
                                    isPlatform
                                      ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                      : 'bg-sky-50 text-sky-700 border border-sky-200'
                                  }`}
                                >
                                  {isPlatform ? 'Kas Platform' : 'Marketing Specialist'}
                                </span>
                              </span>
                              {simBearers.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBearer(idx)}
                                  className="text-slate-400 hover:text-rose-500 p-0.5 transition"
                                  title="Hapus penanggung modal ini"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Dropdown Pemilih Penanggung dari Tabel Marketing Specialist */}
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                Pilih dari Tabel Marketing Specialist / Kas:
                              </label>
                              <select
                                value={b.type === 'platform' ? 'platform' : (b.specialist_id || '')}
                                onChange={(e) => handleBearerSelectChange(idx, e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              >
                                <optgroup label="Tabel Marketing Specialist">
                                  {marketingSpecialists.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name} {m.phone_whatsapp ? `(${m.phone_whatsapp})` : ''}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="Platform / Kas Agency">
                                  <option value="platform">[Kas Platform] Kas Perusahaan / Agency</option>
                                </optgroup>
                              </select>
                            </div>

                            {/* Input Nominal Modal (Rp) & Rasio */}
                            <div>
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="block text-[10px] font-semibold text-slate-500">
                                  Nominal Modal Ditanggung (Rp)
                                </label>
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                  {ratio}% dari HPP
                                </span>
                              </div>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-[11px] font-bold text-slate-400">
                                  Rp
                                </span>
                                <input
                                  type="number"
                                  step="5000"
                                  value={b.amount}
                                  onChange={(e) => handleBearerAmountChange(idx, Number(e.target.value) || 0)}
                                  className="w-full pl-8 pr-2 py-1 text-xs font-bold text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddBearer}
                      className="w-full py-1.5 bg-white hover:bg-slate-100 text-indigo-600 text-xs font-bold rounded-xl border border-dashed border-indigo-300 flex items-center justify-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Marketing Specialist
                    </button>

                    {/* Balance Status Callout */}
                    <div
                      className={`p-2 rounded-xl text-[10px] font-semibold flex items-center justify-between border ${
                        bearerDifference === 0
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      <span>
                        Teralokasi: <strong>Rp {totalBearersAllocated.toLocaleString('id-ID')}</strong> / Rp{' '}
                        {simHpp.toLocaleString('id-ID')}
                      </span>
                      <span>
                        {bearerDifference === 0 ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% Pas
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-700 font-bold">
                            <AlertCircle className="w-3 h-3 text-amber-600" /> Selisih Rp{' '}
                            {Math.abs(bearerDifference).toLocaleString('id-ID')}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live Calculation Output Card */}
            <div className="lg:col-span-7 bg-slate-900 text-white rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Hasil Kalkulasi Sistem Otomatis
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Status: <strong className="text-emerald-400">100% Balance</strong>
                </span>
              </div>

              {/* Step By Step Numbers */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                  <span>1. Gross Profit (Deal - HPP):</span>
                  <span className="font-bold text-white">Rp {simResult.gross_profit.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 text-cyan-300">
                  <span>2. Developer Fee Timbal-Balik (10%):</span>
                  <span className="font-bold">Rp {simResult.developer_fee_10.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 text-amber-300">
                  <span>3. Uang Transport Flat:</span>
                  <span className="font-bold">Rp {simResult.marketing_transport.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 text-emerald-300">
                  <span>4. Sisa Laba Bersih yang Dibagi (Net Split):</span>
                  <span className="font-bold">Rp {simResult.net_split_profit.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Recipient Distribution Card */}
              <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700/80 space-y-2 text-xs">
                <p className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Alokasi Hak Penerima (Settlement Payout):</span>
                  <span className="text-indigo-400 font-normal">{simResult.developer_fee_recipient_notes}</span>
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 space-y-1">
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Hak Marketing Specialist (Total)</p>
                    <p className="text-base font-black text-emerald-400">
                      Rp {simResult.marketing_total_payout.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[9px] text-slate-400 leading-tight">
                      Reimb: Rp {simResult.reimburse_marketing.toLocaleString('id-ID')} + Trans: Rp{' '}
                      {simResult.marketing_transport.toLocaleString('id-ID')} + Share: Rp{' '}
                      {simResult.marketing_final_share.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 space-y-1">
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Hak Developer Fee (Founder)</p>
                    <p className="text-base font-black text-cyan-400">
                      Rp {simResult.developer_fee_10.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[9px] text-slate-400 leading-tight">
                      Vicky: Rp {simResult.developer_fee_vicky.toLocaleString('id-ID')} | Natan: Rp{' '}
                      {simResult.developer_fee_natan.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* MULTI-BEARER BREAKDOWN TABLE IN RESULT */}
                {simHppMode === 'custom_split' && simResult.bearers_summary && simResult.bearers_summary.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-700/80">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Rincian Payout per Penanggung Modal ({simResult.bearers_summary.length} Pihak):
                    </p>
                    <div className="space-y-1.5">
                      {simResult.bearers_summary.map((item, idx) => (
                        <div
                          key={item.bearer.id || idx}
                          className="p-2 bg-slate-900 rounded-lg border border-slate-700/80 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <p className="font-bold text-white flex items-center gap-1.5">
                              {item.bearer.name}
                              <span className="text-[9px] font-normal text-slate-400">
                                (Modal Rp {item.amount.toLocaleString('id-ID')} • {item.ratio.toFixed(1)}%)
                              </span>
                            </p>
                            <p className="text-[9px] text-slate-400 mt-0.5">
                              Reimb: Rp {item.reimburse.toLocaleString('id-ID')}
                              {item.transport > 0 ? ` + Trans: Rp ${item.transport.toLocaleString('id-ID')}` : ''}
                              {item.final_share > 0 ? ` + Share: Rp ${item.final_share.toLocaleString('id-ID')}` : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-emerald-400 text-xs">
                              Rp {item.total_payout.toLocaleString('id-ID')}
                            </p>
                            <p className="text-[9px] font-semibold text-cyan-300">
                              Laba Murni: +Rp {item.net_income.toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Verification Callout */}
              <div className="text-[11px] text-slate-400 flex items-start gap-2 bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-800/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Hasil total pembagian (Rp {(simResult.marketing_total_payout + simResult.platform_total_payout).toLocaleString('id-ID')}) persis sama 100% dengan Deal Amount (Rp {simDealAmount.toLocaleString('id-ID')}). Tidak ada dana mengendap atau selisih pembulatan.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: DIVIDEN EKUITAS BULANAN & BIAYA SERVER (PASAL 2 & 3) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  2. Formula Laba Bersih Bulanan & Dividen Saham 51% : 49% (Pasal 2 & 3 PKS)
                </h3>
                <p className="text-xs text-slate-500">
                  Dihitung berkala setiap akhir bulan untuk membagikan deviden ekuitas setelah dipotong biaya operasional server
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Pasal 2 & 3
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="font-bold text-slate-800">1. Pendapatan Kotor Bulanan</span>
              <p className="text-slate-500">Akumulasi seluruh pembayaran dari venue kafe dikurangi pengeluaran modal HPP.</p>
              <p className="font-mono text-indigo-600 font-bold">Gross Profit = Revenue - Total HPP</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="font-bold text-slate-800">2. Potong Biaya Server Riil</span>
              <p className="text-slate-500">Disisihkan untuk tagihan Supabase, domain, Vercel, dan WhatsApp Gateway.</p>
              <p className="font-mono text-indigo-600 font-bold">Net After Server = Gross - Server Cost</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="font-bold text-slate-800">3. Dividen 51% : 49%</span>
              <p className="text-slate-500">Dibagikan kepada para pendiri sesuai porsi ekuitas kepemilikan saham.</p>
              <p className="font-mono text-emerald-600 font-bold">Vicky: 51% | Natan: 49%</p>
            </div>
          </div>

          {/* Interactive Monthly Dividend Calculator */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Simulasi Dividen Laba Bersih Bulanan:</span>
              <span className="text-[11px] text-slate-500 font-medium">Fungsi: <code className="font-mono">calculateMonthlyNetProfitWithServerCost()</code></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Omset Bulanan (Rp)</label>
                <input
                  type="number"
                  step="500000"
                  value={simMonthlyRevenue}
                  onChange={(e) => setSimMonthlyRevenue(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Biaya HPP (Rp)</label>
                <input
                  type="number"
                  step="250000"
                  value={simMonthlyHpp}
                  onChange={(e) => setSimMonthlyHpp(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Biaya Server & Cloud (Rp)</label>
                <input
                  type="number"
                  step="50000"
                  value={simServerCost}
                  onChange={(e) => setSimServerCost(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/70">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Laba Bersih Siap Bagi</span>
                <p className="text-base font-black text-slate-900 mt-0.5">
                  Rp {monthlyResult.distributable_profit.toLocaleString('id-ID')}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Setelah dikurangi pool 10%</p>
              </div>
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200">
                <span className="text-[10px] text-indigo-700 uppercase font-bold">Vicky Galih P. (51%)</span>
                <p className="text-base font-black text-indigo-900 mt-0.5">
                  Rp {monthlyResult.vicky_equity_dividend.toLocaleString('id-ID')}
                </p>
                <p className="text-[10px] text-indigo-600 mt-0.5">Saham Mayoritas (Inisiator & Leader)</p>
              </div>
              <div className="p-3 bg-cyan-50/70 rounded-xl border border-cyan-200">
                <span className="text-[10px] text-cyan-700 uppercase font-bold">Natan Setyo A. (49%)</span>
                <p className="text-base font-black text-cyan-900 mt-0.5">
                  Rp {monthlyResult.natan_equity_dividend.toLocaleString('id-ID')}
                </p>
                <p className="text-[10px] text-cyan-600 mt-0.5">Saham Minoritas (Mitra Pendiri)</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: HAK KEBERLANJUTAN KLIEN / SUBSCRIPTION (PASAL 7 AYAT 3 B) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <RefreshCw className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  3. Hak Keberlanjutan Klien & Retainer Langganan (Pasal 7 Ayat 3 b)
                </h3>
                <p className="text-xs text-slate-500">
                  Trailing profit share untuk repeat order dan perpanjangan langganan bulanan kafe
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Pasal 7 Ayat 3 b
            </span>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed space-y-2">
            <p>
              Sesuai klausul hukum <strong>Pasal 7 Ayat 3 Butir b</strong>, apabila Marketing Specialist atau mantan Marketing Specialist berhenti dari tugas aktif,
              yang bersangkutan <strong>tetap berhak penuh dan berkelanjutan menerima bagi hasil</strong> atas seluruh klien/venue yang
              pernah dibawanya selama masa aktif:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800">Paket Langganan Retainer Bulanan:</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Untuk perpanjangan retainer (misal Rp 49.000/bulan), tidak ada modal fisik (HPP = 0) dan tidak ada uang transport.
                  Developer Fee 10% tetap berlaku, dan 90% sisanya dibagikan ke Marketing Specialist penanggung jawab klien.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800">Kepastian Pembayaran Berkala:</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Seluruh perpanjangan tercatat di tabel riwayat transaksi sistem dan diverifikasi pencairannya oleh Super Admin
                  secara transparan setiap siklus penagihan.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
