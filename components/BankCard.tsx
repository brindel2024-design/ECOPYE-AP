'use client'

import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export type CardNetwork = 'CIB' | 'DAHABIA' | 'BARIDIMOB' | 'UNKNOWN'

interface BankCardProps {
  cardNumber: string
  holderName: string
  expiry: string
  cvv: string
  network: CardNetwork
  flipped: boolean
}

function detectNetwork(number: string): CardNetwork {
  const n = number.replace(/\s/g, '')
  if (n.startsWith('4') || n.startsWith('5')) return 'CIB'
  if (n.startsWith('6')) return 'DAHABIA'
  if (n.startsWith('9')) return 'BARIDIMOB'
  return 'UNKNOWN'
}

function maskNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16)
  const padded = digits.padEnd(16, '•')
  return [0, 4, 8, 12].map((i) => padded.slice(i, i + 4)).join('  ')
}

function NetworkBadge({ network }: { network: CardNetwork }) {
  const styles: Record<CardNetwork, { label: string; cls: string }> = {
    CIB:      { label: 'CIB',      cls: 'bg-white/20 text-white' },
    DAHABIA:  { label: 'DAHABIA',  cls: 'bg-yellow-400/90 text-yellow-900' },
    BARIDIMOB:{ label: 'BARIDIMOB',cls: 'bg-amber-400/90 text-amber-900' },
    UNKNOWN:  { label: '●●●',      cls: 'bg-white/10 text-white/60' },
  }
  const s = styles[network]
  return (
    <span className={cn('text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full', s.cls)}>
      {s.label}
    </span>
  )
}

export { detectNetwork }

export default function BankCard({ cardNumber, holderName, expiry, cvv, network, flipped }: BankCardProps) {
  return (
    <div className="w-full max-w-sm mx-auto" style={{ perspective: '1000px', height: '200px' }}>
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: 'preserve-3d', position: 'relative', width: '100%', height: '100%' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <div className="relative w-full h-full bg-gradient-card p-6 flex flex-col justify-between shadow-wallet">
            {/* Glare */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
            {/* Circles décoratifs */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5" />

            {/* Header */}
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">EcoPye</p>
                <p className="text-sm font-semibold text-white/80 mt-0.5">Carte de Paiement</p>
              </div>
              <NetworkBadge network={network} />
            </div>

            {/* Chip + numéro */}
            <div className="relative z-10 space-y-3">
              {/* Chip */}
              <div className="w-10 h-7 rounded-md bg-gradient-to-br from-gold-300 to-gold-500 opacity-90 flex items-center justify-center">
                <div className="w-6 h-4 rounded-sm border border-gold-700/40 grid grid-cols-3 gap-px p-0.5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="bg-gold-600/50 rounded-[1px]" />
                  ))}
                </div>
              </div>
              {/* Numéro */}
              <p className="font-mono text-xl font-semibold tracking-[0.18em] text-white">
                {maskNumber(cardNumber)}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-end justify-between relative z-10">
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-widest">Titulaire</p>
                <p className="text-sm font-semibold text-white truncate max-w-[160px] mt-0.5">
                  {holderName.toUpperCase() || 'VOTRE NOM'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-white/40 uppercase tracking-widest">Expire</p>
                <p className="text-sm font-semibold text-white mt-0.5 font-mono">
                  {expiry || 'MM/AA'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="relative w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col justify-between shadow-wallet">
            {/* Bande magnétique */}
            <div className="w-full h-12 bg-black/80 mt-8" />

            {/* Signature + CVV */}
            <div className="px-6 space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-10 bg-white/90 rounded-lg px-3 flex items-center">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div key={i} className="w-1 h-5 bg-gray-300/60 rounded-full" style={{ transform: `rotate(${(i % 3) * 15 - 15}deg)` }} />
                    ))}
                  </div>
                </div>
                <div className="w-14 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                  <p className="font-mono font-bold text-gray-800 tracking-widest text-sm">
                    {cvv ? cvv.padEnd(3, '•') : '•••'}
                  </p>
                </div>
              </div>
              <p className="text-[9px] text-white/30 text-right">CVV / CVC</p>
            </div>

            <div className="px-6 pb-4">
              <p className="text-[9px] text-white/30 text-center leading-relaxed">
                Cette carte est la propriété d&apos;EcoPye. Usage réservé au titulaire.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
