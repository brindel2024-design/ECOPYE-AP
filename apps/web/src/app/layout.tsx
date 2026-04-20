import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'ECOPYE — Paiement mobile algérien',
  description: 'Transferts P2P, paiements QR, factures et cagnottes pour l\'Algérie.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ecopye.fr'),
  openGraph: {
    title: 'ECOPYE',
    description: 'Paiement mobile algérien moderne et conforme.',
    locale: 'fr_DZ',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
