'use client';

import React, { useState } from 'react';
import { Send, MessageSquare, CheckCircle2, X } from 'lucide-react';
import { Venue } from '@/lib/types';

export function formatWhatsAppFeedbackUrl(params: {
  whatsappNumber: string;
  venueName: string;
  rating: number;
  tableNumber?: string;
  customerName?: string;
  message: string;
}): string {
  const cleanPhone = params.whatsappNumber.replace(/\D/g, '');
  const lines = [
    `*Halo Manajemen ${params.venueName}*`,
    `Saya pelanggan ingin menyampaikan kritik/saran terkait pelayanan:`,
    ``,
    `⭐ Rating: ${params.rating}/5`,
    params.tableNumber ? `📍 Meja: ${params.tableNumber}` : '',
    params.customerName ? `👤 Nama: ${params.customerName}` : '',
    `💬 Pesan:`,
    params.message,
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

interface PrivateFeedbackModalProps {
  venue: Venue;
  rating: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PrivateFeedbackModal({ venue, rating, isOpen, onClose }: PrivateFeedbackModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);

    // Save to Database
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: venue.id,
          customerName,
          tableNumber,
          rating,
          message,
        }),
      });

      // Log negative feedback scan
      await fetch('/api/tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: venue.id,
          actionTaken: 'negative_feedback',
          ratingSelected: rating,
        }),
      });
    } catch (err) {
      console.error(err);
    }

    // If channel is whatsapp or both, launch WhatsApp
    if ((venue.feedback_channels === 'whatsapp' || venue.feedback_channels === 'both') && venue.whatsapp_number) {
      const waUrl = formatWhatsAppFeedbackUrl({
        whatsappNumber: venue.whatsapp_number,
        venueName: venue.name,
        rating,
        tableNumber,
        customerName,
        message,
      });
      window.location.href = waUrl;
      return;
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <span className="text-xl">🙏</span>
            <h3 className="font-bold text-slate-800">Beri Masukan untuk Manajemen</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-slate-800">Terima Kasih Atas Masukan Anda</h4>
            <p className="text-sm text-slate-500 mt-1">Masukan Anda telah diteruskan langsung ke tim manajemen {venue.name}.</p>
            <button
              onClick={onClose}
              className="mt-6 w-full py-2.5 bg-slate-900 text-white rounded-xl font-medium"
            >
              Selesai
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="mt-4 space-y-3">
            <p className="text-xs text-slate-500">
              Kritik dan saran Anda sangat berharga agar kami dapat memberikan pelayanan yang lebih baik.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-600">Nama (Opsional)</label>
                <input
                  type="text"
                  placeholder="Mis: Siti"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00c48c] focus:border-[#00c48c] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">No Meja (Opsional)</label>
                <input
                  type="text"
                  placeholder="Mis: 07"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00c48c] focus:border-[#00c48c] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Pesan Masukan / Keluhan *</label>
              <textarea
                required
                rows={3}
                placeholder="Ceritakan apa yang bisa kami tingkatkan..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00c48c] focus:border-[#00c48c] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#00c48c] hover:bg-[#00a877] active:scale-98 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-500/25"
            >
              {venue.feedback_channels === 'whatsapp' || venue.feedback_channels === 'both' ? (
                <>
                  <MessageSquare className="w-4 h-4" />
                  Kirim ke WhatsApp Manajemen
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Kirim Masukan Pribadi
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
