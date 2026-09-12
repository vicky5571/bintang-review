'use client';

import React, { useState, useEffect } from 'react';
import { Venue, SalesAgentSummary, PaymentConfirmation } from '@/lib/types';
import { dataStore } from '@/lib/store';
import { Plus, QrCode, ExternalLink, DollarSign, Store, LogOut, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import { AdminVenueModal } from '@/components/AdminVenueModal';
import { QrGeneratorModal } from '@/components/QrGeneratorModal';
import { AdminLoginModal } from '@/components/AdminLoginModal';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [salesAgents, setSalesAgents] = useState<SalesAgentSummary[]>([]);
  const [payments, setPayments] = useState<PaymentConfirmation[]>([]);
  const [selectedVenueForEdit, setSelectedVenueForEdit] = useState<Venue | null>(null);
  const [selectedVenueForQr, setSelectedVenueForQr] = useState<Venue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const loadData = async () => {
    const vList = await dataStore.listVenues();
    setVenues(vList);
    const saList = await dataStore.listSalesAgents();
    setSalesAgents(saList);
    const pList = await dataStore.listPaymentConfirmations();
    setPayments(pList);
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      if (data.authenticated) {
        setIsAuthenticated(true);
        await loadData();
      }
    } catch (err) {
      console.error('Failed to check admin auth:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setIsAuthenticated(false);
  };

  const handleSaveVenue = async (formData: Partial<Venue>) => {
    if (selectedVenueForEdit) {
      await dataStore.updateVenue(selectedVenueForEdit.id, formData);
    } else {
      await dataStore.createVenue(formData as any);
    }
    setIsModalOpen(false);
    setSelectedVenueForEdit(null);
    await loadData();
  };

  const handleVerifyPayment = async (id: string, status: 'approved' | 'rejected') => {
    await dataStore.verifyPaymentConfirmation(id, status, 'Diverifikasi oleh Super Admin');
    await loadData();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Memverifikasi akses console admin...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLoginModal
        onSuccess={() => {
          setIsAuthenticated(true);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#84cc16] via-[#10b981] to-[#06b6d4] text-white flex items-center justify-center font-black shadow-md shadow-lime-500/15">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900">
              Bintang<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#84cc16] to-[#06b6d4]">Review</span> — Super Admin
            </h1>
            <p className="text-xs text-slate-500">Developer & Agency Management Console</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedVenueForEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#84cc16] via-[#10b981] to-[#06b6d4] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Tambah Klien Venue
          </button>

          <button
            onClick={handleLogout}
            title="Kunci & Keluar Panel Admin"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-semibold rounded-xl border border-slate-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 space-y-8">
        {/* Venues Table Card */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#10b981]" />
              <h2 className="font-bold text-slate-800">Daftar Klien Kafe & Venue ({venues.length})</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Nama Venue</th>
                  <th className="px-6 py-3.5">Slug & Tap Link</th>
                  <th className="px-6 py-3.5">Mode</th>
                  <th className="px-6 py-3.5">PIN Owner</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {venues.map((v) => (
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
                    <td className="px-6 py-4 text-right space-x-2">
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
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payment Verifications Section */}
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

        {/* Sales & Commission Dashboard */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-[#84cc16]" />
            <h2 className="font-bold text-slate-800">Mesin Komisi Sales & Referral Partner</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {salesAgents.map((agent) => (
              <div key={agent.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2 hover:border-emerald-200 transition">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">{agent.name}</h3>
                  <span className="text-xs bg-gradient-to-r from-lime-50 to-cyan-50 text-slate-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full font-bold">
                    {agent.commission_rate}%
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
      </main>

      {/* Edit / Create Modal */}
      <AdminVenueModal
        venue={selectedVenueForEdit}
        isOpen={isModalOpen}
        salesAgents={salesAgents}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVenueForEdit(null);
        }}
        onSave={handleSaveVenue}
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
    </div>
  );
}
