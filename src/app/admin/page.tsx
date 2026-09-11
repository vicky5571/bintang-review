'use client';

import React, { useState, useEffect } from 'react';
import { Venue, SalesAgentSummary } from '@/lib/types';
import { dataStore } from '@/lib/store';
import { Plus, QrCode, ExternalLink, DollarSign, Store, LogOut } from 'lucide-react';
import { AdminVenueModal } from '@/components/AdminVenueModal';
import { QrGeneratorModal } from '@/components/QrGeneratorModal';
import { AdminLoginModal } from '@/components/AdminLoginModal';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [salesAgents, setSalesAgents] = useState<SalesAgentSummary[]>([]);
  const [selectedVenueForEdit, setSelectedVenueForEdit] = useState<Venue | null>(null);
  const [selectedVenueForQr, setSelectedVenueForQr] = useState<Venue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const loadData = async () => {
    const vList = await dataStore.listVenues();
    setVenues(vList);
    const saList = await dataStore.listSalesAgents();
    setSalesAgents(saList);
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
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
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⭐</span>
          <div>
            <h1 className="text-lg font-black tracking-tight">Bintang Review — Super Admin</h1>
            <p className="text-xs text-slate-400">Developer & Agency Management Console</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedVenueForEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#00c48c] hover:bg-[#00a877] text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" /> Tambah Klien Venue
          </button>

          <button
            onClick={handleLogout}
            title="Kunci & Keluar Panel Admin"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 space-y-8">
        {/* Venues Table Card */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#00c48c]" />
              <h2 className="font-bold text-slate-800">Daftar Klien Kafe & Venue ({venues.length})</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b">
                <tr>
                  <th className="px-6 py-3">Nama Venue</th>
                  <th className="px-6 py-3">Slug & Tap Link</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3">PIN Owner</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {venues.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{v.name}</td>
                    <td className="px-6 py-4">
                      <a
                        href={`/r/${v.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 font-mono text-xs flex items-center gap-1 hover:underline"
                      >
                        /r/{v.slug} <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          v.redirect_mode === 'smart_funnel'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {v.redirect_mode === 'smart_funnel' ? '⭐ Smart Funnel' : '⚡ 1-Click Direct'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-600">{v.owner_access_pin}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
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
                        className="p-2 text-slate-600 hover:text-[#00c48c] rounded-lg hover:bg-slate-100 transition"
                        title="Download QR & NFC"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVenueForEdit(v);
                          setIsModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 text-slate-800 font-medium text-xs rounded-lg hover:bg-slate-200"
                      >
                        Edit
                      </button>
                      <a
                        href={`/portal/${v.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-slate-900 text-white font-medium text-xs rounded-lg hover:bg-slate-800"
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

        {/* Sales & Commission Dashboard */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-[#00c48c]" />
            <h2 className="font-bold text-slate-800">Mesin Komisi Sales & Referral Partner</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {salesAgents.map((agent) => (
              <div key={agent.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">{agent.name}</h3>
                  <span className="text-xs bg-emerald-50 text-[#00a877] border border-emerald-200/60 px-2 py-0.5 rounded-full font-bold">
                    {agent.commission_rate}%
                  </span>
                </div>
                <div className="text-xs text-slate-500">Venue Terjual: {agent.total_venues} kafe</div>
                <div className="text-xs text-slate-500">
                  Total Deal: Rp {agent.total_revenue.toLocaleString('id-ID')}
                </div>
                <div className="pt-2 border-t font-black text-sm text-[#00a877]">
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
