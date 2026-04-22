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

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-card text-white shadow-wallet">
      {/* Décor : vagues subtiles + cercles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute top-10 right-10 w-40 h-40 rounded-full border border-white/15" />
        <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-brand-400/20 blur-3xl" />
      </div>

      {/* Liseré or saharien en haut */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-gold" />

      <div className="relative z-10 p-6">
        {/* En-tête : label + devise */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-white/60 text-[11px] font-semibold uppercase tracking-[0.15em]">
              Solde Ecopye
            </p>
            <p className="text-white/90 font-medium text-sm mt-1">{ownerName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-white/15 backdrop-blur px-2.5 py-1 rounded-full font-semibold tracking-wider">
              DZD
            </span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="w-8 h-8 rounded-full bg-white/15 backdrop-blur flex items-center justify-center hover:bg-white/25 transition-colors"
              aria-label="Masquer le solde"
            >
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Solde en grand */}
        <div className="mb-7">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-extrabold tracking-tight tabular leading-none">
              {showBalance ? formatDZD(balance).replace(' DZD', '') : '•••••'}
            </span>
            <span className="text-white/70 text-lg font-semibold">DZD</span>
          </div>
        </div>

        {/* Actions inline */}
        <div className="flex gap-2 mb-6">
          <Link
            href="/topup"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-brand-700 font-semibold text-sm shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Recharger
          </Link>
          <Link
            href="/transfer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white font-semibold text-sm hover:bg-white/25 active:scale-[0.98] transition-all"
          >
            <Send className="w-4 h-4" />
            Envoyer
          </Link>
        </div>

        {/* Stats mensuelles */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/15">
          <div className="flex-1 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-success-500/25 backdrop-blur flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-success-100" />
            </div>
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-wide">Reçu</p>
              <p className="text-white font-bold text-sm tabular">
                {showBalance ? formatDZD(monthlyIn).replace(' DZD', '') : '•••'}
              </p>
            </div>
          </div>
          <div className="w-px h-10 bg-white/15" />
          <div className="flex-1 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-500/30 backdrop-blur flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-gold-100" />
            </div>
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-wide">Dépensé</p>
              <p className="text-white font-bold text-sm tabular">
                {showBalance ? formatDZD(monthlyOut).replace(' DZD', '') : '•••'}
              </p>
            </div>
          </div>
        </div>

        {/* Numéro + liseré or en bas */}
        <div className="mt-5 flex items-center justify-between">
          <p className="text-white/50 text-xs font-mono tracking-widest">
            {phone.replace(/(\+\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}
          </p>
          <div className="h-1 w-10 rounded-full bg-gradient-gold" />
        </div>
      </div>
    </div>
  )
}
