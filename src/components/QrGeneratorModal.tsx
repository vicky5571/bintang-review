'use client';

import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, X, QrCode, Smartphone } from 'lucide-react';
import { Venue } from '@/lib/types';
import { generateNfcPayload, generateQrDataUrl, generateQrSvgString } from '@/lib/qr';

interface QrGeneratorModalProps {
  venue: Venue | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QrGeneratorModal({ venue, isOpen, onClose }: QrGeneratorModalProps) {
  const [svgContent, setSvgContent] = useState<string>('');
  const [pngDataUrl, setPngDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!venue) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bintangreview.id';
    const targetUrl = generateNfcPayload(venue.slug, origin);

    generateQrSvgString(targetUrl).then(setSvgContent);
    generateQrDataUrl(targetUrl).then(setPngDataUrl);
  }, [venue]);

  if (!isOpen || !venue) return null;

  const targetUrl = typeof window !== 'undefined'
    ? generateNfcPayload(venue.slug, window.location.origin)
    : `https://bintangreview.id/r/${venue.slug}`;

  const copyNfc = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSvg = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${venue.slug}-print.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    const a = document.createElement('a');
    a.href = pngDataUrl;
    a.download = `QR-${venue.slug}-print-1024px.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#00c48c]" />
            <h3 className="font-bold text-slate-800">Aset QR & NFC — {venue.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-6 items-center">
          {/* QR Preview */}
          <div className="w-48 h-48 p-2 border-2 border-slate-100 rounded-2xl shadow-inner bg-white flex items-center justify-center">
            {pngDataUrl ? (
              <img src={pngDataUrl} alt="QR Code" className="w-full h-full object-contain" />
            ) : (
              <div className="text-xs text-slate-400">Rendering QR...</div>
            )}
          </div>

          {/* NFC & Print Actions */}
          <div className="flex-1 space-y-3 w-full">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dynamic NFC URL</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  readOnly
                  value={targetUrl}
                  className="w-full px-3 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono text-slate-700 select-all"
                />
                <button
                  onClick={copyNfc}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-slate-800 active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-[#00c48c]" /> Tulis URL ini ke chip NTAG213 via aplikasi NFC Tools.
              </p>
            </div>

            <div className="pt-2 border-t flex flex-col gap-2">
              <button
                onClick={downloadPng}
                className="w-full py-2.5 px-3 bg-[#00c48c] hover:bg-[#00a877] text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-98 transition"
              >
                <Download className="w-3.5 h-3.5" /> Unduh PNG High-Res (1024px)
              </button>
              <button
                onClick={downloadSvg}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" /> Unduh Vektor SVG (Untuk Cetak UV)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
