'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Droplets,
  Phone,
  Receipt,
  Smartphone,
  Wifi,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { formatDZD } from '@/lib/utils'

interface Provider {
  id: string
  name: string
  type: string
  min: number
  max: number
}

interface BillHistory {
  id: string
  provider: string
  accountNumber: string
  amount: number
  reference: string
  status: string
  paidAt: string
}

const PROVIDER_META: Record<string, { icon: React.ElementType; color: string; category: string }> = {
  mobilis:         { icon: Smartphone, color: 'bg-blue-50 text-blue-600',   category: 'Mobile' },
  djezzy:          { icon: Phone,      color: 'bg-red-50 text-red-500',     category: 'Mobile' },
  ooredoo:         { icon: Phone,      color: 'bg-orange-50 text-orange-500', category: 'Mobile' },
  sonelgaz:        { icon: Zap,        color: 'bg-amber-50 text-amber-600', category: 'Énergie' },
  seaal:           { icon: Droplets,   color: 'bg-cyan-50 text-cyan-600',   category: 'Eau' },
  algerie_telecom: { icon: Wifi,       color: 'bg-purple-50 text-purple-600', category: 'Télécom' },
  algerie_poste:   { icon: Building2,  color: 'bg-yellow-50 text-yellow-600', category: 'Poste' },
}

const CATEGORIES = ['Tout', 'Mobile', 'Énergie', 'Eau', 'Télécom', 'Poste']

type Step = 'list' | 'form' | 'confirm' | 'success'

export default function BillsPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [history, setHistory] = useState<BillHistory[]>([])
  const [category, setCategory] = useState('Tout')
  const [step, setStep] = useState<Step>('list')
  const [selected, setSelected] = useState<Provider | null>(null)
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState<{ reference: string; paidAt: string } | null>(null)
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bills').then(r => r.json()).then(setProviders)
    fetch('/api/bills/history').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setHistory(data)
      setHistoryLoading(false)
    }).catch(() => setHistoryLoading(false))
  }, [])

  const filtered = providers.filter(p => {
    if (category === 'Tout') return true
    return PROVIDER_META[p.id]?.category === category
  })

  const parsedAmount = parseFloat(amount) || 0
  const meta = selected ? PROVIDER_META[selected.id] : null

  async function submitPayment() {
    if (!selected) return
    if (!accountNumber.trim()) { toast.error('Numéro de compte requis'); return }
    if (parsedAmount < selected.min || parsedAmount > selected.max) {
      toast.error(`Montant entre ${selected.min} et ${selected.max} DZD`); return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selected.id, accountNumber, amount: parsedAmount, pin }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReceipt({ reference: data.receipt.reference, paidAt: data.receipt.paidAt })
      setStep('success')
      toast.success(`Facture ${selected.name} payée !`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur paiement')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep('list')
    setSelected(null)
    setAccountNumber('')
    setAmount('')
    setPin('')
    setReceipt(null)
    // Refresh history
    fetch('/api/bills/history').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setHistory(data)
    })
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <AnimatePresence mode="wait">

        {/* ─── LISTE FOURNISSEURS ─── */}
        {step === 'list' && (
          <motion.div key="list" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Payer une facture</h1>
              <p className="text-sm text-gray-500 mt-0.5">Opérateurs, énergie, eau, télécom</p>
            </div>

            {/* Filtres catégories */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    category === cat
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grille fournisseurs */}
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(p => {
                const m = PROVIDER_META[p.id]
                const Icon = m?.icon ?? Building2
                return (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelected(p); setStep('form') }}
                    className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-brand-200 hover:shadow-card transition-all text-left flex items-center gap-3"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${m?.color ?? 'bg-gray-100 text-gray-500'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{m?.category}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Min {p.min} DZD</p>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Historique récent */}
            {(historyLoading || history.length > 0) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" /> Derniers paiements
                  </h2>
                </div>
                {historyLoading ? (
                  <div className="p-4 space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-xl bg-gray-100" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-gray-100 rounded w-24" />
                          <div className="h-2.5 bg-gray-100 rounded w-16" />
                        </div>
                        <div className="h-3 bg-gray-100 rounded w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {history.slice(0, 5).map(h => {
                      const m = PROVIDER_META[h.provider]
                      const Icon = m?.icon ?? Receipt
                      const pName = providers.find(p => p.id === h.provider)?.name ?? h.provider
                      return (
                        <div key={h.id} className="flex items-center gap-3 px-4 py-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m?.color ?? 'bg-gray-100 text-gray-500'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{pName}</p>
                            <p className="text-xs text-gray-400 font-mono">{h.accountNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">−{formatDZD(h.amount)}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(h.paidAt).toLocaleDateString('fr-DZ', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── FORMULAIRE ─── */}
        {step === 'form' && selected && meta && (
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('list')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Payer {selected.name}</h1>
                <p className="text-sm text-gray-500">{meta.category} · {selected.min}–{selected.max} DZD</p>
              </div>
            </div>

            {/* Fournisseur sélectionné */}
            <div className={`flex items-center gap-4 p-4 rounded-2xl ${meta.color.split(' ')[0]}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${meta.color}`}>
                <meta.icon className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{selected.name}</p>
                <p className="text-sm text-gray-500">{meta.category}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              {/* Numéro compte/abonné */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Numéro d'abonné / N° de contrat
                </label>
                <input
                  type="text"
                  placeholder="Ex: 0550123456 ou 012345678"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-surface-50"
                  autoFocus
                />
              </div>

              {/* Montant */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Montant</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0"
                    min={selected.min}
                    max={selected.max}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full text-right text-3xl font-bold text-gray-900 bg-surface-50 rounded-xl px-4 py-5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="absolute right-4 bottom-2 text-sm text-gray-400 font-medium">DZD</span>
                </div>
                {/* Montants rapides */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[500, 1000, 2000, 5000].filter(v => v >= selected.min && v <= selected.max).map(v => (
                    <button key={v} onClick={() => setAmount(String(v))}
                      className="text-xs py-2 bg-brand-50 text-brand-700 rounded-xl hover:bg-brand-100 font-semibold">
                      {formatDZD(v)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!accountNumber.trim()) { toast.error('Numéro requis'); return }
                if (parsedAmount < selected.min) { toast.error(`Minimum ${selected.min} DZD`); return }
                if (parsedAmount > selected.max) { toast.error(`Maximum ${selected.max} DZD`); return }
                setStep('confirm')
              }}
              className="w-full py-4 bg-gradient-brand text-white font-semibold rounded-2xl shadow-card hover:shadow-card-hover active:scale-95 transition-all"
            >
              Continuer
            </button>
          </motion.div>
        )}

        {/* ─── CONFIRMATION + PIN ─── */}
        {step === 'confirm' && selected && meta && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('form')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Confirmer le paiement</h1>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div className={`flex items-center gap-3 pb-4 border-b border-gray-100`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${meta.color}`}>
                  <meta.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{selected.name}</p>
                  <p className="text-sm text-gray-500 font-mono">{accountNumber}</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  { l: 'Fournisseur',   v: selected.name },
                  { l: 'N° abonné',     v: accountNumber },
                  { l: 'Montant',       v: formatDZD(parsedAmount) },
                  { l: 'Frais',         v: 'Gratuit', green: true },
                ].map(row => (
                  <div key={row.l} className="flex justify-between text-sm">
                    <span className="text-gray-500">{row.l}</span>
                    <span className={`font-semibold ${row.green ? 'text-green-600' : 'text-gray-900'}`}>{row.v}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="font-bold text-gray-900">Total débité</span>
                  <span className="font-extrabold text-brand-700 text-lg">{formatDZD(parsedAmount)}</span>
                </div>
              </div>
            </div>

            {/* PIN */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <label className="text-sm font-semibold text-gray-800 block mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Confirmez avec votre PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="• • • •"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-3xl font-mono tracking-[0.6em] py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface-50"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('form')}
                className="flex-1 py-3.5 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50">
                Modifier
              </button>
              <button
                onClick={submitPayment}
                disabled={loading || pin.length !== 4}
                className="flex-1 py-3.5 bg-gradient-brand text-white font-semibold rounded-2xl shadow-card disabled:opacity-60 active:scale-95 transition-all"
              >
                {loading ? 'Traitement…' : 'Payer maintenant'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── SUCCÈS ─── */}
        {step === 'success' && selected && meta && receipt && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-6">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto"
            >
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </motion.div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">Facture payée !</h2>
              <p className="text-gray-500 mt-1">
                <span className="font-semibold text-brand-600">{formatDZD(parsedAmount)}</span> débités pour{' '}
                <span className="font-semibold">{selected.name}</span>
              </p>
            </div>

            {/* Reçu */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-left space-y-2.5 mx-auto max-w-xs">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-3">Reçu de paiement</p>
              {[
                { l: 'Fournisseur',   v: selected.name },
                { l: 'N° abonné',     v: accountNumber },
                { l: 'Montant',       v: formatDZD(parsedAmount) },
                { l: 'Référence',     v: receipt.reference.slice(0, 16) + '…', mono: true },
                { l: 'Date',          v: new Date(receipt.paidAt).toLocaleString('fr-DZ') },
              ].map(row => (
                <div key={row.l} className="flex justify-between text-sm">
                  <span className="text-gray-400">{row.l}</span>
                  <span className={`font-semibold text-gray-900 ${row.mono ? 'font-mono text-xs' : ''}`}>{row.v}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={reset}
                className="flex-1 py-4 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50">
                Nouvelle facture
              </button>
              <a href="/dashboard"
                className="flex-1 py-4 bg-gradient-brand text-white font-semibold rounded-2xl shadow-card text-center">
                Accueil
              </a>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
