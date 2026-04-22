import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    default: 'ECOPYE — Paiement Électronique Algérie',
    template: '%s | ECOPYE',
  },
  description:
    'Application de paiement électronique sécurisée pour le marché algérien. Transférez de l\'argent, payez vos marchands et gérez votre portefeuille en dinars algériens.',
  keywords: ['paiement', 'algérie', 'DZD', 'transfert', 'wallet', 'fintech', 'BaridiMob', 'CIB'],
  authors: [{ name: 'ECOPYE' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#006233',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
