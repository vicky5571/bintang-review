'use client';

import React, { useState, useEffect } from 'react';
import { Venue, MarketingSpecialist, MarketingSpecialistSummary, PaymentConfirmation, AuthSession } from '@/lib/types';
import { calculateProfitDistribution, calculateVenueSettlement } from '@/lib/profitSharing';
import { Plus, QrCode, ExternalLink, DollarSign, Store, LogOut, CreditCard, CheckCircle, XCircle, Clock, UserPlus, Briefcase, Award, TrendingUp, Receipt, PiggyBank, Car, Building2, Percent, CheckCircle2, AlertCircle, Wallet } from 'lucide-react';
import { AdminVenueModal } from '@/components/AdminVenueModal';
import { AdminMarketingModal } from '@/components/AdminMarketingModal';
import { AdminSettlementModal } from '@/components/AdminSettlementModal';
import { QrGeneratorModal } from '@/components/QrGeneratorModal';
import { AdminLoginModal } from '@/components/AdminLoginModal';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [marketingSpecialists, setMarketingSpecialists] = useState<MarketingSpecialistSummary[]>([]);
  const [payments, setPayments] = useState<PaymentConfirmation[]>([]);
  const [selectedVenueForEdit, setSelectedVenueForEdit] = useState<Venue | null>(null);
  const [selectedVenueForQr, setSelectedVenueForQr] = useState<Venue | null>(null);
  const [selectedVenueForSettlement, setSelectedVenueForSettlement] = useState<Venue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isMarketingModalOpen, setIsMarketingModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  const loadData = async (user?: AuthSession | null) => {
    try {
      const activeUser = user || currentUser;
      const [resV, resM, resP] = await Promise.all([
        fetch('/api/admin/venues'),
        fetch('/api/admin/marketing-specialists'),
        activeUser?.role === 'super_admin' ? fetch('/api/admin/payment') : Promise.resolve(null),
      ]);

      if (resV.ok) {
        const dV = await resV.json();
        setVenues(dV.venues || []);
      }

      if (resM.ok) {
        const dM = await resM.json();
        setMarketingSpecialists(dM.marketingSpecialists || []);
      }

      if (resP && resP.ok) {
        const dP = await resP.json();
        setPayments(dP.payments || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  const checkAuth = async () => {
    try {
      // 1. Try unified auth session endpoint
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        await loadData(data.user);
        return;
      }

      // 2. Fallback to /api/admin/auth
      const resAdmin = await fetch('/api/admin/auth');
      const dataAdmin = await resAdmin.json();
      if (dataAdmin.authenticated) {
        const userObj: AuthSession = dataAdmin.user || {
          authenticated: true,
          role: dataAdmin.role || 'super_admin',
          name: dataAdmin.name || 'Super Admin',
        };
        setIsAuthenticated(true);
        setCurrentUser(userObj);
        await loadData(userObj);
        return;
      }

      setIsAuthenticated(false);
      setCurrentUser(null);
    } catch (err) {
      console.error('Error verifying auth:', err);
      setIsAuthenticated(false);
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await Promise.all([
        fetch('/api/auth/me', { method: 'POST' }),
        fetch('/api/admin/auth', { method: 'DELETE' }),
      ]);
    } catch (err) {
      console.error('Logout error:', err);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleSaveVenue = async (venueData: Partial<Venue>) => {
    try {
      const res = await fetch('/api/admin/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venueData),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        alert(data.error || 'Gagal menyimpan venue');
      }
    } catch (err) {
      console.error('Save venue error:', err);
      alert('Terjadi kesalahan saat menyimpan venue.');
    }
  };

  const handleSaveMarketingSpecialist = async (marketingData: Partial<MarketingSpecialist>) => {
    try {
      const res = await fetch('/api/admin/marketing-specialists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marketingData),
      });
      const data = await res.json();
      if (data.success) {
        setIsMarketingModalOpen(false);
        loadData();
      } else {
        alert(data.error || 'Gagal menyimpan data marketing specialist');
      }
    } catch (err) {
      console.error('Save marketing error:', err);
      alert('Terjadi kesalahan saat menyimpan data marketing specialist.');
    }
  };

  const handleVerifyPayment = async (id: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const res = await fetch('/api/admin/payment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, notes }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.error || 'Gagal memperbarui status verifikasi.');
      }
    } catch (err) {
      console.error('Verify payment error:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-medium text-sm">
        Memverifikasi sesi role akses...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLoginModal
        onSuccess={(user) => {
          if (user && user.role) {
            setIsAuthenticated(true);
            setCurrentUser(user);
            loadData(user);
          } else {
            checkAuth();
          }
        }}
      />
    );
  }

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isMarketingSpecialist = currentUser?.role === 'marketing_specialist';

  // Find logged-in specialist stats if applicable
  const currentSpecialistSummary = isMarketingSpecialist
    ? marketingSpecialists.find((m) => m.id === currentUser?.specialist_id)
    : null;

  // Calculate profit sharing distributions and Option B settlements across all loaded venues
  const venueCalculations = venues.map((v) => {
    const dist = calculateProfitDistribution({
      deal_amount: v.deal_amount,
      hpp: v.hpp,
      hpp_payer: v.hpp_payer,
      hpp_marketing_ratio: v.hpp_marketing_ratio,
      transport_fee: v.transport_fee,
    });
    const settlement = calculateVenueSettlement(v);
    return { venue: v, dist, settlement };
  });

  // Financial Totals
  const totalRevenue = venues.reduce((acc, v) => acc + (Number(v.deal_amount) || 0), 0);
  const totalHpp = venues.reduce((acc, v) => acc + (Number(v.hpp !== undefined && v.hpp !== null ? v.hpp : 150000)), 0);
  const totalGrossProfit = totalRevenue - totalHpp;
  const totalMarketingPayout = venueCalculations.reduce((acc, c) => acc + c.dist.marketing_total_payout, 0);
  const totalPlatformPayout = venueCalculations.reduce((acc, c) => acc + c.dist.platform_total_payout, 0);

  // Option B Settlement Monitoring: Outstanding Debts & Paid Totals
  const totalUnpaidHpp = venueCalculations.reduce((acc, c) => acc + c.settlement.unpaid_reimburse_marketing, 0);
  const totalUnpaidProfitShare = venueCalculations.reduce((acc, c) => acc + c.settlement.unpaid_profit_share_marketing, 0);
  const totalUnpaidPayout = totalUnpaidHpp + totalUnpaidProfitShare;

  const totalPaidHpp = venueCalculations.reduce((acc, c) => acc + c.settlement.paid_reimburse_marketing, 0);
  const totalPaidProfitShare = venueCalculations.reduce((acc, c) => acc + c.settlement.paid_profit_share_marketing, 0);
  const totalPaidPayout = totalPaidHpp + totalPaidProfitShare;

  // Marketing Specialist Specific Figures
  const myUnpaidHpp = venueCalculations.reduce((acc, c) => acc + c.settlement.unpaid_reimburse_marketing, 0);
  const myUnpaidProfitShare = venueCalculations.reduce((acc, c) => acc + c.settlement.unpaid_profit_share_marketing, 0);
  const myTotalPaid = venueCalculations.reduce((acc, c) => acc + c.settlement.total_paid_marketing, 0);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#84cc16] via-[#10b981] to-[#06b6d4] text-white flex items-center justify-center font-black shadow-md shadow-lime-500/15">
            {isSuperAdmin ? <Store className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                Bintang<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#84cc16] to-[#06b6d4]">Review</span>
              </h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isSuperAdmin
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                }`}
              >
                {isSuperAdmin ? 'Super Admin' : 'Marketing Specialist'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {isSuperAdmin
                ? 'Developer & Agency Management Console'
                : `Halo, ${currentUser?.name || 'Partner'} • Portal Mitra Klien Kafe`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              setSelectedVenueForEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#84cc16] via-[#10b981] to-[#06b6d4] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Klien Venue</span>
            <span className="sm:hidden">Tambah</span>
          </button>

          <button
            onClick={handleLogout}
            title="Keluar Sesi"
            className="flex items-center gap-1.5 px-3 py-2 sm:py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold rounded-xl border border-slate-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 space-y-8">
        {/* SUPER ADMIN EXECUTIVE FINANCIAL CARDS */}
        {isSuperAdmin && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500">Total Penjualan (Harga Jual)</span>
                <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900">
                Rp {totalRevenue.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{venues.length} transaksi klien aktif</p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500">Total HPP (Modal Produksi)</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900">
                Rp {totalHpp.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Biaya material & akrilik</p>
            </div>

            <div className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-sm transition ${
              totalUnpaidPayout > 0 ? 'border-amber-300 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30' : 'border-emerald-200 bg-gradient-to-br from-emerald-50/40 to-white'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-700">Hutang Payout Belum Dibayar</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  totalUnpaidPayout > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-lg sm:text-xl font-black ${totalUnpaidPayout > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                Rp {totalUnpaidPayout.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">
                Reimb HPP: Rp {totalUnpaidHpp.toLocaleString('id-ID')} • Profit: Rp {totalUnpaidProfitShare.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-cyan-200/80 shadow-sm bg-gradient-to-br from-cyan-50/40 to-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-cyan-800">Net Kas Masuk Platform</span>
                <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center">
                  <PiggyBank className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-cyan-800">
                Rp {totalPlatformPayout.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-cyan-600/80 mt-1">
                Sudah dicairkan ke Mktg: Rp {totalPaidPayout.toLocaleString('id-ID')}
              </p>
            </div>
          </section>
        )}

        {/* MARKETING SPECIALIST PERSONAL SUMMARY CARDS (OPSI B) */}
        {isMarketingSpecialist && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500">Klien Venue Saya</span>
                <div className="w-7 h-7 rounded-lg bg-cyan-50 text-[#06b6d4] flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900">
                {currentSpecialistSummary?.total_venues ?? venues.length}{' '}
                <span className="text-xs font-semibold text-slate-400">kafe</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Kafe mitra aktif</p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-sm bg-gradient-to-br from-amber-50/40 to-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-amber-800">Modal HPP Menunggu Reimburse</span>
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-lg sm:text-xl font-black ${myUnpaidHpp > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                Rp {myUnpaidHpp.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {myUnpaidHpp > 0 ? '⏳ Menunggu reimbursement platform' : '✓ Tidak ada modal nunggak'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-teal-200/80 shadow-sm bg-gradient-to-br from-teal-50/40 to-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-teal-800">Keuntungan Menunggu Transfer</span>
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-lg sm:text-xl font-black ${myUnpaidProfitShare > 0 ? 'text-teal-700' : 'text-slate-800'}`}>
                Rp {myUnpaidProfitShare.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {myUnpaidProfitShare > 0 ? '⏳ Transport flat & bagi hasil profit' : '✓ Semua keuntungan sudah cair'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-emerald-800">Sudah Diterima di Rekening</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-700">
                Rp {myTotalPaid.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Total modal & profit yang sudah lunas
              </p>
            </div>
          </section>
        )}

        {/* Venues Table Card */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#10b981]" />
              <h2 className="font-bold text-slate-800">
                {isMarketingSpecialist ? 'Daftar Klien Kafe Saya' : 'Daftar Klien Kafe & Venue'} ({venues.length})
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Nama Venue</th>
                  <th className="px-6 py-3.5">Slug & Tap Link</th>
                  <th className="px-6 py-3.5">Mode</th>
                  <th className="px-6 py-3.5">Paket</th>
                  <th className="px-6 py-3.5">Harga Jual {isSuperAdmin ? '& HPP' : ''}</th>
                  <th className="px-6 py-3.5">Pelunasan Payout (Opsi B)</th>
                  <th className="px-6 py-3.5">PIN Owner</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {venues.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-slate-400">
                      Belum ada klien kafe terdaftar. Klik <strong>Tambah Klien Venue</strong> untuk mendaftarkan kafe baru.
                    </td>
                  </tr>
                ) : (
                  venues.map((v) => {
                    const price = v.deal_amount || 0;
                    const cogs = v.hpp !== undefined && v.hpp !== null ? v.hpp : 150000;
                    const margin = price - cogs;
                    const item = venueCalculations.find((c) => c.venue.id === v.id);
                    const dist = item ? item.dist : calculateProfitDistribution({
                      deal_amount: v.deal_amount,
                      hpp: v.hpp,
                      hpp_payer: v.hpp_payer,
                      hpp_marketing_ratio: v.hpp_marketing_ratio,
                      transport_fee: v.transport_fee,
                    });
                    const settlement = item ? item.settlement : calculateVenueSettlement(v);

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{v.name}</td>
                        <td className="px-6 py-4">
                          <a
                            href={`/r/${v.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-600 hover:text-cyan-700 font-mono text-xs flex items-center gap-1 hover:underline"
                          >
                            /r/{v.slug} <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              v.redirect_mode === 'smart_funnel'
                                ? 'bg-lime-50 text-lime-800 border border-lime-200/80'
                                : 'bg-cyan-50 text-cyan-800 border border-cyan-200/80'
                            }`}
                          >
                            {v.redirect_mode === 'smart_funnel' ? '⭐ Smart Funnel' : '⚡ 1-Click Direct'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {v.billing_type === 'one_time' || v.monthly_retainer_fee === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-semibold border border-purple-200/80">
                              💎 Lifetime
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-200/80">
                              🔄 Rp {(v.monthly_retainer_fee || 0).toLocaleString('id-ID')}/bln
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 block">
                            Rp {price.toLocaleString('id-ID')}
                          </span>
                          {isSuperAdmin ? (
                            <span className="text-[10px] text-slate-500 block font-normal mt-0.5">
                              HPP: Rp {cogs.toLocaleString('id-ID')} • Margin: <strong className="text-emerald-600 font-semibold">Rp {margin.toLocaleString('id-ID')}</strong>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 block font-normal">Harga Jual Unit</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1.5">
                            {/* Reimburse HPP Status */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-500">HPP:</span>
                              {settlement.reimburse_status === 'not_applicable' ? (
                                <span className="inline-flex items-center text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                                  Modal Platform (N/A)
                                </span>
                              ) : settlement.reimburse_status === 'paid' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Lunas (Rp {settlement.reimburse_marketing.toLocaleString('id-ID')})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Belum (Rp {settlement.reimburse_marketing.toLocaleString('id-ID')})
                                </span>
                              )}
                            </div>

                            {/* Bagi Hasil & Transport Status */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-500">Profit:</span>
                              {settlement.profit_share_status === 'paid' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Lunas (Rp {settlement.profit_share_marketing.toLocaleString('id-ID')})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded-md font-bold border border-cyan-200">
                                  <Clock className="w-3 h-3 text-cyan-600" />
                                  Belum (Rp {settlement.profit_share_marketing.toLocaleString('id-ID')})
                                </span>
                              )}
                            </div>

                            {/* Penanggung HPP info */}
                            <div className="text-[10px] text-slate-400">
                              {v.hpp_payer === 'platform'
                                ? 'Modal: 100% Platform'
                                : v.hpp_payer === 'split'
                                ? `Modal: Split (${v.hpp_marketing_ratio || 50}% : ${100 - (v.hpp_marketing_ratio || 50)}%)`
                                : 'Modal: 100% Marketing'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-600">{v.owner_access_pin}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              v.is_active ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${v.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            {v.is_active ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1.5 sm:space-x-2">
                          {isSuperAdmin && (
                            <button
                              onClick={() => {
                                setSelectedVenueForSettlement(v);
                                setIsSettlementModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 transition inline-flex items-center gap-1 shadow-sm"
                              title="Kelola Pelunasan Reimburse HPP & Bagi Hasil"
                            >
                              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Pelunasan</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedVenueForQr(v);
                              setIsQrModalOpen(true);
                            }}
                            className="p-2 text-slate-500 hover:text-cyan-600 rounded-lg hover:bg-slate-100 transition"
                            title="Download QR & NFC"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedVenueForEdit(v);
                              setIsModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-slate-100 text-slate-700 font-medium text-xs rounded-lg hover:bg-slate-200 transition"
                          >
                            Edit
                          </button>
                          <a
                            href={`/portal/${v.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-slate-900 text-white font-medium text-xs rounded-lg hover:bg-slate-800 transition"
                          >
                            Portal
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Super Admin Only: Payment Verifications Section */}
        {isSuperAdmin && (
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#00c48c]" />
                <h2 className="font-bold text-slate-800 text-sm sm:text-base">
                  Antrean Konfirmasi Pembayaran Retainer ({payments.filter((p) => p.status === 'pending').length} Menunggu)
                </h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Venue Kafe</th>
                    <th className="px-6 py-3">Nominal</th>
                    <th className="px-6 py-3">Metode & Pengirim</th>
                    <th className="px-6 py-3">Catatan / Ref</th>
                    <th className="px-6 py-3">Tanggal Submit</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        🎉 Belum ada konfirmasi pembayaran yang dikirimkan klien.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {p.venue_name || 'Venue'}
                        </td>
                        <td className="px-6 py-4 font-black text-slate-900">
                          Rp {p.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-700 block">{p.payment_method}</span>
                          <span className="text-[11px] text-slate-400">a.n. {p.sender_name}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                          {p.notes || '-'}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-[11px]">
                          {new Date(p.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4">
                          {p.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3" /> Menunggu
                            </span>
                          ) : p.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle className="w-3 h-3" /> Disetujui
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-200">
                              <XCircle className="w-3 h-3" /> Ditolak
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {p.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleVerifyPayment(p.id, 'approved')}
                                className="px-3 py-1.5 bg-[#00c48c] hover:bg-[#00a877] text-slate-950 font-bold rounded-lg shadow-sm transition active:scale-95 text-[11px]"
                              >
                                Setujui (+30 Hari)
                              </button>
                              <button
                                onClick={() => handleVerifyPayment(p.id, 'rejected')}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold rounded-lg border border-rose-200 transition active:scale-95 text-[11px]"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Selesai diproses</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Super Admin Only: Marketing Specialists Dashboard */}
        {isSuperAdmin && (
          <section className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#84cc16]" />
                <h2 className="font-bold text-slate-800 text-sm sm:text-base">Mesin Komisi Marketing Specialist & Mitra Referral</h2>
              </div>
              <button
                onClick={() => setIsMarketingModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#84cc16] via-[#10b981] to-[#06b6d4] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/15 transition active:scale-95 w-fit"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Tambah Marketing Specialist
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {marketingSpecialists.map((agent) => (
                <div key={agent.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2 hover:border-emerald-200 transition">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">{agent.name}</h3>
                    <span className="text-xs bg-gradient-to-r from-lime-50 to-cyan-50 text-slate-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full font-bold">
                      {agent.commission_type === 'percentage' ? `${agent.commission_rate}%` : `Rp ${agent.commission_rate.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">Venue Terjual: {agent.total_venues} kafe</div>
                  <div className="text-xs text-slate-500">
                    Total Deal: Rp {agent.total_revenue.toLocaleString('id-ID')}
                  </div>
                  <div className="pt-2 border-t border-slate-100 font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-[#84cc16] to-[#06b6d4]">
                    Komisi Berhak Diterima: Rp {agent.earned_commission.toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Edit / Create Venue Modal */}
      <AdminVenueModal
        venue={selectedVenueForEdit}
        isOpen={isModalOpen}
        marketingSpecialists={marketingSpecialists}
        currentRole={currentUser?.role}
        currentSpecialistId={currentUser?.specialist_id}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVenueForEdit(null);
        }}
        onSave={handleSaveVenue}
      />

      {/* Marketing Specialist Creation Modal (Super Admin Only) */}
      <AdminMarketingModal
        isOpen={isMarketingModalOpen}
        onClose={() => setIsMarketingModalOpen(false)}
        onSave={handleSaveMarketingSpecialist}
      />

      {/* QR & NFC Asset Viewer */}
      <QrGeneratorModal
        venue={selectedVenueForQr}
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setSelectedVenueForQr(null);
        }}
      />

      {/* Settlement Payout Modal (Super Admin Only - Opsi B) */}
      <AdminSettlementModal
        venue={selectedVenueForSettlement}
        isOpen={isSettlementModalOpen}
        onClose={() => {
          setIsSettlementModalOpen(false);
          setSelectedVenueForSettlement(null);
        }}
        onSuccess={() => loadData()}
      />
    </div>
  );
}

