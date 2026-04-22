'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle, Receipt } from 'lucide-react'
import { api } from '@/lib/api'

interface Provider { id: string; name: string; type: string; minAmount: number; maxAmount: number }

type Step = 'select' | 'form' | 'pin' | 'done'

const providerColors: Record<string, string> = {
  mobile: 'bg-blue-500/20 text-blue-400',
  energy: 'bg-yellow-500/20 text-yellow-400',
  water: 'bg-cyan-500/20 text-cyan-400',
  telecom: 'bg-purple-500/20 text-purple-400',
}

const providerEmoji: Record<string, string> = {
  mobilis: '📱', djezzy: '📡', ooredoo: '🌐',
  sonelgaz: '⚡', seaal: '💧', algerie_telecom: '☎️'
}

const formatDZD = (n: number) =>
  new Intl.NumberFormat('fr-DZ').format(n) + ' DZD'

export default function BillsPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [step, setStep] = useState<Step>('select')
  const [selected, setSelected] = useState<Provider | null>(null)
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [receipt, setReceipt] = useState<{ reference: string; paidAt: string } | null>(null)

  useEffect(() => {
    api.getProviders().then(setProviders)
  }, [])

  const handlePay = async () => {
    setLoading(true); setError('')
    try {
      const res = await api.payBill({ provider: selected!.id, accountNumber, amount: Number(amount), pin })
      setReceipt(res.receipt)
      setStep('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Paiement échoué')
    } finally { setLoading(false) }
  }

  const groups = [
    { label: 'Opérateurs mobiles', type: 'mobile' },
    { label: 'Énergie', type: 'energy' },
    { label: 'Eau', type: 'water' },
    { label: 'Télécom', type: 'telecom' },
  ]

  return (
    <div className="min-h-dvh bg-surface px-5 pt-12">
      <div className="flex items-center gap-4 mb-6">
        {step !== 'select' && (
          <button onClick={() => setStep(step === 'pin' ? 'form' : 'select')} className="tap-feedback">
            <ArrowLeft size={24} className="text-gray-400" />
          </button>
        )}
        <h1 className="text-xl font-bold text-white">Paiement de factures</h1>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
        >
          {/* Sélection fournisseur */}
          {step === 'select' && (
            <div className="space-y-6">
              {groups.map(group => {
                const items = providers.filter(p => p.type === group.type)
                if (!items.length) return null
                return (
                  <div key={group.type}>
                    <h2 className="text-sm font-medium text-gray-400 mb-3">{group.label}</h2>
                    <div className="grid grid-cols-3 gap-3">
                      {items.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setSelected(p); setStep('form') }}
                          className={`card flex flex-col items-center gap-2 py-4 tap-feedback active:scale-95 transition-transform`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${providerColors[p.type] || 'bg-surface-muted'}`}>
                            {providerEmoji[p.id] || '🏢'}
                          </div>
                          <span className="text-xs text-white font-medium text-center leading-tight">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Formulaire */}
          {step === 'form' && selected && (
            <div className="space-y-5">
              <div className="card flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${providerColors[selected.type]}`}>
                  {providerEmoji[selected.id]}
                </div>
                <div>
                  <p className="font-semibold text-white">{selected.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDZD(selected.minAmount)} — {formatDZD(selected.maxAmount)}
                  </p>
                </div>
              </div>

              <input
                type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                className="input-field"
                placeholder={
                  selected.type === 'mobile' ? 'Numéro de téléphone' :
                  selected.type === 'energy' ? 'Numéro de compteur' :
                  'Numéro de compte'
                }
                inputMode={selected.type === 'mobile' ? 'tel' : 'text'}
              />
              <input
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                className="input-field" placeholder="Montant en DZD"
                inputMode="decimal" min={selected.minAmount} max={selected.maxAmount}
              />

              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                onClick={() => {
                  if (!accountNumber) return setError('Numéro requis')
                  if (Number(amount) < selected.minAmount) return setError(`Minimum ${formatDZD(selected.minAmount)}`)
                  setError(''); setStep('pin')
                }}
                className="btn-primary"
              >
                Continuer
              </button>
            </div>
          )}

          {/* PIN */}
          {step === 'pin' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Paiement {selected?.name}</p>
                <p className="text-3xl font-bold text-white mt-1">{formatDZD(Number(amount))}</p>
                <p className="text-xs text-gray-500 font-mono mt-1">{accountNumber}</p>
              </div>

              <div className="flex justify-center gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
                  <button key={i} disabled={k === ''}
                    onClick={() => {
                      if (k === '⌫') setPin(p => p.slice(0,-1))
                      else if (k !== '' && pin.length < 6) setPin(p => p + k)
                    }}
                    className={`h-16 rounded-2xl text-xl font-semibold tap-feedback
                      ${k === '' ? 'invisible' : 'bg-surface-muted text-white'}`}
                  >{k}</button>
                ))}
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button onClick={handlePay} disabled={pin.length !== 6 || loading} className="btn-primary">
                {loading ? 'Paiement en cours…' : 'Confirmer le paiement'}
              </button>
            </div>
          )}

          {/* Reçu */}
          {step === 'done' && receipt && (
            <div className="flex flex-col items-center gap-6 pt-8">
              <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center">
                <CheckCircle className="text-brand-500" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-white">Facture payée !</h2>
              <div className="card w-full space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Fournisseur</span>
                  <span className="text-white text-sm font-medium">{selected?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Compte</span>
                  <span className="text-white text-sm font-mono">{accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Montant</span>
                  <span className="text-brand-400 font-bold">{formatDZD(Number(amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Référence</span>
                  <span className="text-xs text-gray-500 font-mono">{receipt.reference.slice(0,8)}…</span>
                </div>
              </div>
              <div className="flex gap-3 w-full">
                <button className="btn-secondary flex items-center justify-center gap-2 flex-1">
                  <Receipt size={16} /> Reçu
                </button>
                <button onClick={() => { setStep('select'); setPin(''); setAmount(''); setAccountNumber('') }} className="btn-primary flex-1">
                  Nouvelle facture
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
