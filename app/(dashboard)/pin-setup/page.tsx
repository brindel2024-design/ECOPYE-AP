'use client'

import PinPad from '@/components/PinPad'
import { useLanguage } from '@/lib/LanguageContext'
import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

type Step = 'create' | 'confirm' | 'success'

export default function PinSetupPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [step, setStep] = useState<Step>('create')
  const [firstPin, setFirstPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleFirstPin(pin: string) {
    setFirstPin(pin)
    setStep('confirm')
  }

  async function handleConfirmPin(pin: string) {
    if (pin !== firstPin) {
      setError(t('pin_mismatch'))
      setStep('create')
      setFirstPin('')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erreur')
        return
      }
      setStep('success')
      toast.success(t('pin_success'))
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8 animate-fade-in">
      {step === 'create' && (
        <PinPad
          title={t('pin_setup_title')}
          subtitle={t('pin_setup_subtitle')}
          onComplete={handleFirstPin}
          error={error}
        />
      )}

      {step === 'confirm' && (
        <PinPad
          title={t('confirm_pin')}
          subtitle="Répétez votre code PIN pour confirmer"
          onComplete={handleConfirmPin}
          loading={loading}
        />
      )}

      {step === 'success' && (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t('pin_success')}</h2>
          <p className="text-gray-500 text-sm">Vos transactions sont maintenant sécurisées</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-6 py-3 bg-gradient-brand text-white rounded-xl font-semibold hover:brightness-110 transition-all"
          >
            {t('home')}
          </button>
        </div>
      )}
    </div>
  )
}
