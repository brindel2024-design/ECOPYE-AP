'use client'

import BankCard, { detectNetwork, type CardNetwork } from '@/components/BankCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDZD } from '@/lib/utils'
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

type Step = 'card' | 'amount' | 'confirm' | 'success'

interface CardData {
  number: string
  holder: string
  expiry: string
  cvv: string
}

function formatCardNumber(raw: string): string {
  return raw
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

const MERCHANTS = [
  { id: 'amazon-dz',  name: 'Amazon.dz',      category: 'E-commerce' },
  { id: 'jumia',      name: 'Jumia Algérie',   category: 'E-commerce' },
  { id: 'ooredoo-dz', name: 'Ooredoo Online',  category: 'Recharge' },
  { id: 'cts',        name: 'CTS Tickets',     category: 'Transport' },
  { id: 'autre',      name: 'Autre site',      category: 'Divers' },
]

export default function CardPaymentPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('card')
  const [card, setCard] = useState<CardData>({ number: '', holder: '', expiry: '', cvv: '' })
  const [cvvFocused, setCvvFocused] = useState(false)
  const [network, setNetwork] = useState<CardNetwork>('UNKNOWN')

  const [merchantName, setMerchantName] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ reference: string; maskedCard: string; paymentMethod: string } | null>(null)

  const parsedAmount = parseFloat(amount) || 0

  const updateCard = useCallback((field: keyof CardData, value: string) => {
    setCard((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === 'number') setNetwork(detectNetwork(value))
      return updated
    })
  }, [])

  const isCardValid =
    card.number.replace(/\s/g, '').length === 16 &&
    card.holder.trim().length >= 3 &&
    /^\d{2}\/\d{2}$/.test(card.expiry) &&
    card.cvv.length === 3

  async function handleConfirm() {
    if (parsedAmount < 100) {
      toast.error('Montant minimum : 100 DZD')
      return
    }
    if (!merchantName.trim()) {
      toast.error('Choisissez un marchand')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/payment/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber: card.number.replace(/\s/g, ''),
          holderName: card.holder,
          expiry: card.expiry,
          cvv: card.cvv,
          amount: parsedAmount,
          merchantName: merchantName.trim(),
          description: description.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Paiement refusé')
        return
      }
      setResult({ reference: data.reference, maskedCard: data.maskedCard, paymentMethod: data.paymentMethod })
      setStep('success')
    } catch {
      toast.error('Erreur réseau — réessayez')
    } finally {
      setLoading(false)
    }
  }

  function goBack() {
    const prev: Record<Step, Step> = { card: 'card', amount: 'card', confirm: 'amount', success: 'card' }
    setStep(prev[step])
  }

  return (
    <div className="space-y-5 animate-fade-in pb-8">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        {step !== 'success' && (
          <button
            onClick={step === 'card' ? () => router.back() : goBack}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-600" />
            {step === 'success' ? 'Paiement accepté' : 'Payer par carte'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {step === 'card'    && 'Saisissez les informations de votre carte'}
            {step === 'amount'  && 'Montant et marchand'}
            {step === 'confirm' && 'Vérifiez avant de payer'}
            {step === 'success' && 'Transaction confirmée'}
          </p>
        </div>
      </div>

      {/* Indicateur d'étapes */}
      {step !== 'success' && (
        <div className="flex gap-1.5">
          {(['card', 'amount', 'confirm'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                ['card', 'amount', 'confirm'].indexOf(step) >= i
                  ? 'bg-brand-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}

      {/* ── ÉTAPE 1 : Carte ─────────────────────────────────────────────── */}
      {step === 'card' && (
        <div className="space-y-5">
          <BankCard
            cardNumber={card.number}
            holderName={card.holder}
            expiry={card.expiry}
            cvv={card.cvv}
            network={network}
            flipped={cvvFocused}
          />

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft space-y-4">
            <Input
              label="Numéro de carte"
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
              maxLength={19}
              value={card.number}
              leftIcon={<CreditCard className="w-4 h-4" />}
              onChange={(e) => updateCard('number', formatCardNumber(e.target.value))}
            />

            <Input
              label="Nom du titulaire"
              placeholder="Ex: AHMED BENALI"
              value={card.holder}
              onChange={(e) => updateCard('holder', e.target.value.toUpperCase())}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Date d'expiration"
                placeholder="MM/AA"
                inputMode="numeric"
                maxLength={5}
                value={card.expiry}
                onChange={(e) => updateCard('expiry', formatExpiry(e.target.value))}
              />
              <Input
                label="CVV"
                placeholder="•••"
                inputMode="numeric"
                maxLength={3}
                type="password"
                value={card.cvv}
                leftIcon={<Lock className="w-3.5 h-3.5" />}
                onChange={(e) => updateCard('cvv', e.target.value.replace(/\D/g, '').slice(0, 3))}
                onFocus={() => setCvvFocused(true)}
                onBlur={() => setCvvFocused(false)}
              />
            </div>
          </div>

          {/* Badge sécurité */}
          <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
            <ShieldCheck className="w-4 h-4 text-brand-500" />
            <span>Connexion sécurisée — données chiffrées TLS 256-bit</span>
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={!isCardValid}
            onClick={() => setStep('amount')}
          >
            Continuer
          </Button>
        </div>
      )}

      {/* ── ÉTAPE 2 : Montant ───────────────────────────────────────────── */}
      {step === 'amount' && (
        <div className="space-y-4">
          {/* Carte miniature */}
          <div className="bg-gradient-card rounded-2xl px-5 py-3 flex items-center gap-3 shadow-card">
            <CreditCard className="w-5 h-5 text-white/70" />
            <div>
              <p className="text-xs text-white/50">Carte sélectionnée</p>
              <p className="text-sm font-semibold text-white font-mono tracking-wider">
                **** **** **** {card.number.replace(/\s/g, '').slice(-4)}
              </p>
            </div>
            <span className="ml-auto text-[10px] font-bold text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
              {network}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft space-y-4">
            {/* Sélection marchand */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Marchand</label>
              <div className="grid grid-cols-2 gap-2">
                {MERCHANTS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMerchantName(m.name)}
                    className={`text-left px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      merchantName === m.name
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold truncate">{m.name}</p>
                    <p className="text-[11px] text-gray-400">{m.category}</p>
                  </button>
                ))}
              </div>
              {/* Saisie libre */}
              <input
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400"
                placeholder="Ou saisissez un nom de marchand..."
                value={MERCHANTS.some((m) => m.name === merchantName) ? '' : merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
              />
            </div>

            {/* Montant */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Montant</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  min={100}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-right text-3xl font-bold text-gray-900 bg-surface-50 rounded-xl px-4 py-5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
                <span className="absolute right-4 bottom-2 text-sm text-gray-400 font-medium">DZD</span>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[500, 1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(String(amt))}
                    className="text-xs py-2 px-1 bg-brand-50 text-brand-700 rounded-xl hover:bg-brand-100 font-medium"
                  >
                    {formatDZD(amt)}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Description (optionnel)"
              placeholder="Ex: Commande #12345"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={parsedAmount < 100 || !merchantName.trim()}
            onClick={() => setStep('confirm')}
          >
            Vérifier le paiement
          </Button>
        </div>
      )}

      {/* ── ÉTAPE 3 : Confirmation ──────────────────────────────────────── */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <BankCard
            cardNumber={card.number}
            holderName={card.holder}
            expiry={card.expiry}
            cvv={card.cvv}
            network={network}
            flipped={false}
          />

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft space-y-4">
            <h2 className="font-semibold text-gray-900">Récapitulatif</h2>

            <div className="space-y-2.5">
              {[
                { label: 'Marchand',  value: merchantName },
                { label: 'Carte',     value: `**** **** **** ${card.number.replace(/\s/g, '').slice(-4)}` },
                { label: 'Réseau',    value: network },
                { label: 'Montant',   value: formatDZD(parsedAmount), highlight: true },
                { label: 'Frais',     value: 'Gratuit',               green: true },
                ...(description ? [{ label: 'Description', value: description }] : []),
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{row.label}</span>
                  <span className={
                    row.highlight ? 'font-bold text-brand-700 text-base' :
                    row.green     ? 'font-medium text-green-600' :
                                   'font-medium text-gray-900'
                  }>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="font-bold text-gray-900">Total débité</span>
              <span className="font-bold text-xl text-brand-700">{formatDZD(parsedAmount)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Ce paiement est sécurisé et irréversible. Vérifiez les informations avant de confirmer.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={goBack}>
              Modifier
            </Button>
            <Button size="lg" className="flex-1" loading={loading} onClick={handleConfirm}>
              Payer {formatDZD(parsedAmount)}
            </Button>
          </div>
        </div>
      )}

      {/* ── ÉTAPE 4 : Succès ────────────────────────────────────────────── */}
      {step === 'success' && result && (
        <div className="text-center space-y-6 py-4 animate-slide-up">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30" />
            <div className="relative w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Paiement accepté !</h2>
            <p className="text-gray-500 mt-1">
              <span className="font-semibold text-brand-600">{formatDZD(parsedAmount)}</span>
              {' '}payés à{' '}
              <span className="font-semibold text-gray-800">{merchantName}</span>
            </p>
          </div>

          <div className="bg-surface-100 rounded-2xl p-4 space-y-2 text-sm max-w-xs mx-auto">
            <div className="flex justify-between">
              <span className="text-gray-500">Référence</span>
              <span className="font-mono text-xs text-gray-700 font-semibold">{result.reference.slice(0, 12)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Carte</span>
              <span className="font-mono text-xs text-gray-700">{result.maskedCard}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Réseau</span>
              <span className="font-semibold text-brand-700">{result.paymentMethod}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                setStep('card')
                setCard({ number: '', holder: '', expiry: '', cvv: '' })
                setNetwork('UNKNOWN')
                setMerchantName('')
                setAmount('')
                setDescription('')
                setResult(null)
              }}
            >
              Nouveau paiement
            </Button>
            <Button size="lg" className="flex-1" onClick={() => router.push('/dashboard')}>
              Accueil
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
