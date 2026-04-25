'use client'

import { formatDZD } from '@/lib/utils'
import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff, Plus, Send } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

interface WalletCardProps {
  balance: number
  ownerName: string
  phone: string
  monthlyIn?: number
  monthlyOut?: number
}

export default function WalletCard({
  balance,
  ownerName,
  phone,
  monthlyIn = 0,
  monthlyOut = 0,
}: WalletCardProps) {
  const [showBalance, setShowBalance] = useState(true)

  const formattedPhone = phone.replace(/(\+\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
  const lastFour = phone.slice(-4)
  const netMonthly = monthlyIn - monthlyOut
  const netPositive = netMonthly >= 0

  return (
    <div className="relative w-full rounded-[28px] overflow-hidden text-white shadow-wallet">
      {/* Base : dégradé profond émeraude → nuit */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#03281C_0%,#055C3D_40%,#0A9465_100%)]" />

      {/* Texture : grille de points subtile */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-screen"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
        aria-hidden
      />

      {/* Halo or latéral */}
      <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full bg-gold-500/12 blur-[80px] pointer-events-none" />
      <div className="absolute -left-16 -bottom-20 w-72 h-72 rounded-full bg-brand-400/20 blur-[70px] pointer-events-none" />

      {/* Arcs géométriques en haut à droite */}
      <svg className="absolute -top-6 -right-6 w-48 h-48 opacity-[0.12]" viewBox="0 0 200 200" aria-hidden>
        <circle cx="200" cy="0" r="200" fill="none" stroke="white" strokeWidth="1" />
        <circle cx="200" cy="0" r="140" fill="none" stroke="white" strokeWidth="1" />
        <circle cx="200" cy="0" r="80" fill="none" stroke="white" strokeWidth="1" />
      </svg>

      {/* Barre or saharien en haut — accent fort */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold-400 via-gold-500 to-gold-300" />

      <div className="relative z-10 p-6 md:p-7">
        {/* ── Ligne du haut : marque + chip + actions ───────────────── */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Chip façon carte bancaire */}
            <div className="w-9 h-7 rounded-md bg-gradient-to-br from-gold-300 via-gold-500 to-gold-700 shadow-inner relative overflow-hidden">
              <div className="absolute inset-0.5 rounded-[4px] border border-gold-200/40" />
              <div className="absolute inset-x-1 top-1/2 -translate-y-1/2 h-px bg-gold-800/50" />
              <div className="absolute inset-x-1 top-1/2 translate-y-1 h-px bg-gold-800/30" />
            </div>
            <div>
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.22em]">
                ECOPYE · Portefeuille
              </p>
              <p className="text-white/95 font-semibold text-sm mt-0.5 tracking-tight">
                {ownerName}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/20 hover:scale-105 active:scale-95 transition-all"
            aria-label={showBalance ? 'Masquer le solde' : 'Afficher le solde'}
          >
            {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        {/* ── Solde hero : typographie éditoriale ──────────────────── */}
        <div className="mt-8 md:mt-10">
          <div className="flex items-baseline gap-3">
            <span className="text-white/50 text-[11px] font-bold uppercase tracking-[0.25em]">
              Solde disponible
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
            <span className="text-[10px] font-extrabold text-gold-300 tracking-widest">DZD</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[clamp(2.5rem,8vw,4.5rem)] font-extrabold tracking-[-0.035em] leading-[0.9] tabular">
              {showBalance
                ? new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(balance)
                : '• • • • •'}
            </span>
          </div>

          {/* Delta net mensuel — chip éditorial */}
          {showBalance && (
            <div className="mt-3 inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  netPositive ? 'bg-success-500/30' : 'bg-gold-500/30'
                }`}
              >
                {netPositive ? (
                  <ArrowUpRight className="w-3 h-3 text-success-100" />
                ) : (
                  <ArrowDownLeft className="w-3 h-3 text-gold-100" />
                )}
              </span>
              <span className="text-[11px] font-bold text-white/90 tabular">
                {netPositive ? '+' : ''}
                {formatDZD(netMonthly).replace(' DZD', '')}
              </span>
              <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
                ce mois
              </span>
            </div>
          )}
        </div>

        {/* ── Actions primaires ────────────────────────────────────── */}
        <div className="mt-7 grid grid-cols-2 gap-2.5">
          <Link
            href="/topup"
            className="group flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-brand-800 font-bold text-sm shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            Recharger
          </Link>
          <Link
            href="/transfer"
            className="group flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-sm hover:bg-white/20 active:scale-[0.98] transition-all"
          >
            <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            Envoyer
          </Link>
        </div>

        {/* ── Pied de carte : numéro + expiration style ────────────── */}
        <div className="mt-7 flex items-end justify-between">
          <div>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">
              Compte
            </p>
            <p className="text-white/80 font-mono text-[13px] tracking-[0.18em]">
              •••• •••• •••• {lastFour}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">
              Titulaire
            </p>
            <p className="text-white/80 text-[11px] font-semibold tracking-wider uppercase">
              {ownerName.split(' ').slice(0, 2).join(' ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
