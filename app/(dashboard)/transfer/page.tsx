'use client'

import PinModal from '@/components/PinModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/lib/LanguageContext'
import { calculateFee, formatDZD, getMobileOperator, isValidAlgerianPhone, normalizePhone } from '@/lib/utils'
import {
  ArrowLeft,
  CheckCircle2,
  Phone,
  Send,
  User,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

type Step = 'form' | 'confirm' | 'success'

export default function TransferPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    recipientPhone: '',
    amount: '',
    description: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [recipient, setRecipient] = useState<{ fullName: string; phone: string } | null>(null)
  const [transactionRef, setTransactionRef] = useState('')
  const [showPin, setShowPin] = useState(false)
  const { t } = useLanguage()

  const amount = parseFloat(form.amount) || 0
  const fee = amount > 0 ? calculateFee(amount) : 0
  const total = amount + fee

  function validate() {
    const newErrors: Record<string, string> = {}
    if (!isValidAlgerianPhone(form.recipientPhone)) {
      newErrors.recipientPhone = 'Numéro algérien invalide'
    }
    if (!amount || amount < 100) {
      newErrors.amount = 'Montant minimum: 100 DZD'
    }
    if (amount > 1000000) {
      newErrors.amount = 'Montant maximum: 1 000 000 DZD'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function lookupRecipient() {
    if (!validate()) return
    setLoading(true)
    try {
      const phone = normalizePhone(form.recipientPhone)
      const res = await fetch(`/api/users/lookup?phone=${encodeURIComponent(phone)}`)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Utilisateur introuvable')
        return
      }
      setRecipient(data)
      setStep('confirm')
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  async function confirmTransfer() {
    setLoading(true)
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: normalizePhone(form.recipientPhone),
          amount,
          description: form.description,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Transfert échoué')
        return
      }
      setTransactionRef(data.reference)
      setStep('success')
    } catch {
      toast.error('Erreur lors du transfert')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        {step !== 'success' && (
          <button
            onClick={() => step === 'confirm' ? setStep('form') : router.back()}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {step === 'success' ? 'Transfert effectué' : 'Envoyer de l\'argent'}
          </h1>
          <p className="text-sm text-gray-500">
            {step === 'form' && 'Vers n\'importe quel numéro algérien'}
            {step === 'confirm' && 'Vérifiez les détails avant de confirmer'}
            {step === 'success' && 'Votre transfert a été envoyé'}
          </p>
        </div>
      </div>

      {/* Étape formulaire */}
      {step === 'form' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
            <Input
              label="Numéro du bénéficiaire"
              type="tel"
              placeholder="0555 000 000"
              value={form.recipientPhone}
              onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
              leftIcon={<Phone className="w-4 h-4" />}
              hint={form.recipientPhone && isValidAlgerianPhone(form.recipientPhone)
                ? `Opérateur: ${getMobileOperator(form.recipientPhone)}`
                : 'Numéro Djezzy, Mobilis ou Ooredoo'
              }
              error={errors.recipientPhone}
            />

            {/* Montant */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Montant à envoyer
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  min={100}
                  max={1000000}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full text-right text-3xl font-bold text-gray-900 bg-surface-50 rounded-xl px-4 py-5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                <span className="absolute right-4 bottom-2 text-sm text-gray-400 font-medium">DZD</span>
              </div>
              {errors.amount && (
                <p className="text-xs text-red-500 mt-1">⚠ {errors.amount}</p>
              )}

              {/* Montants rapides */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[1000, 5000, 10000, 20000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setForm({ ...form, amount: String(amt) })}
                    className="text-xs py-2 px-1 bg-brand-50 text-brand-700 rounded-xl hover:bg-brand-100 font-medium transition-colors"
                  >
                    {formatDZD(amt)}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Motif (optionnel)"
              placeholder="Ex: Remboursement, loyer..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={100}
            />
          </div>

          {/* Résumé des frais */}
          {amount > 0 && (
            <div className="bg-brand-50 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Montant à envoyer</span>
                <span className="font-semibold">{formatDZD(amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Frais (0.5%)</span>
                <span className="font-semibold text-amber-600">{formatDZD(fee)}</span>
              </div>
              <div className="border-t border-brand-200 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total débité</span>
                <span className="font-bold text-brand-700 text-base">{formatDZD(total)}</span>
              </div>
            </div>
          )}

          <Button
            size="lg"
            className="w-full"
            loading={loading}
            onClick={lookupRecipient}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Continuer
          </Button>
        </div>
      )}

      {/* Étape confirmation */}
      {step === 'confirm' && recipient && (
        <div className="space-y-4">
          {/* Destinataire */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h2 className="text-sm font-medium text-gray-500 mb-3">Destinataire</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-brand-600">
                  {recipient.fullName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{recipient.fullName}</p>
                <p className="text-sm text-gray-500">{recipient.phone}</p>
                <p className="text-xs text-green-600 mt-0.5">✓ Compte ECOPYE vérifié</p>
              </div>
            </div>
          </div>

          {/* Détails transfert */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-sm font-medium text-gray-500 mb-1">Détails du transfert</h2>
            {[
              { label: 'Montant envoyé', value: formatDZD(amount), bold: false },
              { label: 'Frais de transfert', value: formatDZD(fee), bold: false },
              ...(form.description ? [{ label: 'Motif', value: form.description, bold: false }] : []),
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-3 flex justify-between">
              <span className="font-semibold text-gray-900">Total débité</span>
              <span className="font-bold text-brand-700 text-lg">{formatDZD(total)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep('form')}>
              {t('modify')}
            </Button>
            <Button size="lg" className="flex-1" loading={loading} onClick={() => setShowPin(true)}>
              {t('confirm')}
            </Button>
          </div>

          {/* Modal PIN */}
          <PinModal
            open={showPin}
            onClose={() => setShowPin(false)}
            onSuccess={confirmTransfer}
          />
        </div>
      )}

      {/* Succès */}
      {step === 'success' && (
        <div className="text-center space-y-5 py-4">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfert envoyé !</h2>
            <p className="text-gray-500">
              <span className="font-semibold text-brand-600">{formatDZD(amount)}</span> ont bien
              été envoyés à <span className="font-semibold">{recipient?.fullName}</span>
            </p>
            {transactionRef && (
              <p className="text-xs text-gray-400 mt-2 font-mono">
                Réf: {transactionRef}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => {
                setStep('form')
                setForm({ recipientPhone: '', amount: '', description: '' })
                setRecipient(null)
              }}
            >
              Nouveau transfert
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => router.push('/dashboard')}
            >
              Accueil
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
