import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bintang Review — Smart NFC & QR Review System',
  description: 'Solusi stand akrilik pintar dan review funnel untuk kafe & bisnis lokal di Indonesia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
