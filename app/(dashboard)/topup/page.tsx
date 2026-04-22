'use client'

import { Button } from '@/components/ui/button'
import { formatDZD } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, CreditCard, Phone, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

const methods = [
  { id: 'cib', label: 'Carte CIB', desc: 'Carte interbancaire algérienne', icon: CreditCard, color: 'bg-blue-50 text-blue-600' },
  { id: 'baridimob', label: 'BaridiMob', desc: 'Algérie Poste Mobile', icon: Smartphone, color: 'bg-yellow-50 text-yellow-600' },
  { id: 'dahabia', label: 'Carte Dahabia', desc: 'Carte CCP Algérie Poste', icon: CreditCard, color: 'bg-orange-50 text-orange-600' },
]

type Step = 'select' | 'amount' | 'success'

export default function TopupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('select')
  const [method, setMethod] = useState<typeof methods[0] | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [newBalance, setNewBalance] = useState(0)

  const parsed = parseFloat(amount) || 0

  async function confirm() {
    if (parsed < 500) {
      toast.error('Montant minimum: 500 DZD')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsed, method: method?.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de la recharge')
        return
      }
      setNewBalance(data.newBalance)
      setStep('success')
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        {step !== 'success' && (
          <button
            onClick={() => step === 'amount' ? setStep('select') : router.back()}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {step === 'success' ? 'Recharge effectuée' : 'Recharger mon portefeuille'}
          </h1>
          <p className="text-sm text-gray-500">
            {step === 'select' && 'Choisissez votre moyen de paiement'}
            {step === 'amount' && 'Entrez le montant à recharger'}
            {step === 'success' && 'Votre solde a été mis à jour'}
          </p>
        </div>
      </div>

      {step === 'select' && (
        <div className="space-y-3">
          {methods.map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.id}
                onClick={() => { setMethod(m); setStep('amount') }}
                className="w-full bg-white rounded-2xl p-4 border border-gray-100 hover:border-brand-200 hover:shadow-card transition-all flex items-center gap-4 text-left active:scale-[0.98]"
              >
                <div className={`w-12 h-12 rounded-2xl ${m.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{m.label}</p>
                  <p className="text-sm text-gray-500">{m.desc}</p>
                </div>
              </button>
            )
          })}

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">ℹ️ Mode démonstration</p>
            <p>La recharge est simulée. En production, vous serez redirigé vers la passerelle de paiement sécurisée SATIM.</p>
          </div>
        </div>
      )}

      {step === 'amount' && method && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl ${method.color} flex items-center justify-center`}>
              <method.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{method.label}</p>
              <p className="text-sm text-gray-500">{method.desc}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Montant à recharger</label>
            <div className="relative mb-3">
              <input
                type="number"
                placeholder="0"
                min={500}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-right text-3xl font-bold text-gray-900 bg-surface-50 rounded-xl px-4 py-5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                autoFocus
              />
              <span className="absolute right-4 bottom-2 text-sm text-gray-400 font-medium">DZD</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1000, 5000, 10000, 50000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(String(amt))}
                  className="text-xs py-2 bg-brand-50 text-brand-700 rounded-xl hover:bg-brand-100 font-medium"
                >
                  {formatDZD(amt)}
                </button>
              ))}
            </div>
          </div>

          <Button size="lg" className="w-full" loading={loading} onClick={confirm}>
            Recharger {parsed > 0 ? formatDZD(parsed) : ''}
          </Button>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center space-y-5 py-4">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Recharge réussie !</h2>
            <p className="text-gray-500">
              <span className="font-semibold text-brand-600">{formatDZD(parsed)}</span> ajoutés à votre portefeuille
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Nouveau solde : <span className="font-semibold text-gray-700">{formatDZD(newBalance)}</span>
            </p>
          </div>
          <Button size="lg" className="w-full" onClick={() => router.push('/dashboard')}>
            Retour à l'accueil
          </Button>
        </div>
      )}
    </div>
  )
}
