'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bell, Settings, Eye, EyeOff, Send, QrCode, Receipt, Heart, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'

interface Transaction {
  id: string
  amount: number
  type: string
  direction: 'debit' | 'credit'
  status: string
  createdAt: string
  sender: { fullName: string }
  receiver: { fullName: string }
  note?: string
}

const formatDZD = (n: number) =>
  new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' DZD'

const typeLabels: Record<string, string> = {
  p2p: 'Transfert', qr_payment: 'Paiement QR',
  bill: 'Facture', cagnotte: 'Cagnotte', deposit: 'Dépôt'
}

export default function HomePage() {
  const router = useRouter()
  const { user, wallet, setWallet } = useAppStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<{ sent: { total: number }, received: { total: number } } | null>(null)
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [w, txs, s] = await Promise.all([api.getWallet(), api.getTransactions(), api.getStats()])
        setWallet(w)
        setTransactions(txs.transactions)
        setStats(s)
      } catch { router.push('/login') }
      finally { setLoading(false) }
    }
    load()
  }, [router, setWallet])

  const quickActions = [
    { icon: Send, label: 'Envoyer', href: '/transfer', color: 'text-brand-400' },
    { icon: QrCode, label: 'QR Code', href: '/qr', color: 'text-cyan-400' },
    { icon: Receipt, label: 'Factures', href: '/bills', color: 'text-purple-400' },
    { icon: Heart, label: 'Cagnotte', href: '/cagnotte', color: 'text-pink-400' },
  ]

  return (
    <div className="min-h-dvh bg-surface">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">Bonjour 👋</p>
          <h1 className="text-xl font-bold text-white">{user?.fullName?.split(' ')[0] || 'Utilisateur'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-2xl bg-surface-muted flex items-center justify-center tap-feedback" aria-label="Notifications">
            <Bell size={20} className="text-gray-400" />
          </button>
          <button onClick={() => router.push('/profile')} className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center tap-feedback" aria-label="Profil">
            <span className="text-white text-sm font-bold">{user?.fullName?.[0] || 'U'}</span>
          </button>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Balance Card */}
        <motion.div
          className="balance-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Glow effect */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/20 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-white/70 text-sm font-medium">Solde disponible</p>
              <button onClick={() => setBalanceVisible(v => !v)} className="tap-feedback" aria-label={balanceVisible ? 'Masquer' : 'Afficher'}>
                {balanceVisible ? <Eye size={18} className="text-white/70" /> : <EyeOff size={18} className="text-white/70" />}
              </button>
            </div>

            <div className="amount-display text-white my-2">
              {loading ? '—' : balanceVisible ? formatDZD(Number(wallet?.balance || 0)) : '•••••• DZD'}
            </div>

            <p className="text-white/60 text-xs">{wallet?.currency || 'DZD'} • Compte principal</p>

            {/* Stats rapides */}
            {stats && (
              <div className="flex gap-4 mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <TrendingDown size={16} className="text-red-300" />
                  <div>
                    <p className="text-white/60 text-xs">Dépensé</p>
                    <p className="text-white text-sm font-semibold">
                      {balanceVisible ? formatDZD(Number(stats.sent.total)) : '••• DZD'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-green-300" />
                  <div>
                    <p className="text-white/60 text-xs">Reçu</p>
                    <p className="text-white text-sm font-semibold">
                      {balanceVisible ? formatDZD(Number(stats.received.total)) : '••• DZD'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Actions rapides */}
        <motion.div
          className="grid grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {quickActions.map(({ icon: Icon, label, href, color }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="flex flex-col items-center gap-2 tap-feedback"
              aria-label={label}
            >
              <div className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center">
                <Icon size={24} className={color} />
              </div>
              <span className="text-xs text-gray-400 font-medium">{label}</span>
            </button>
          ))}
        </motion.div>

        {/* Transactions récentes */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">Transactions récentes</h2>
            <button onClick={() => router.push('/history')} className="text-brand-400 text-sm tap-feedback">
              Tout voir
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 skeleton rounded-2xl" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-500 text-sm">Aucune transaction pour le moment</p>
              <p className="text-gray-600 text-xs mt-1">Effectuez votre premier transfert !</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 6).map((tx) => (
                <div key={tx.id} className="card flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0
                    ${tx.direction === 'credit' ? 'bg-brand-500/20' : 'bg-red-500/10'}`}>
                    {tx.direction === 'credit'
                      ? <ArrowDownLeft size={20} className="text-brand-400" />
                      : <ArrowUpRight size={20} className="text-red-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {tx.direction === 'credit' ? tx.sender.fullName : tx.receiver.fullName}
                    </p>
                    <p className="text-xs text-gray-500">{typeLabels[tx.type] || tx.type}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.direction === 'credit' ? 'text-brand-400' : 'text-white'}`}>
                      {tx.direction === 'credit' ? '+' : '-'}{formatDZD(Number(tx.amount))}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(tx.createdAt).toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
