'use client'

import PinPad from '@/components/PinPad'
import { useLanguage } from '@/lib/LanguageContext'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useState } from 'react'

interface PinModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PinModal({ open, onClose, onSuccess }: PinModalProps) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function verifyPin(pin: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json()

      if (data.code === 'NO_PIN') {
        // Pas de PIN configuré → on laisse passer
        onSuccess()
        onClose()
        return
      }

      if (!res.ok) {
        setError(t('pin_wrong'))
        return
      }

      onSuccess()
      onClose()
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        'relative bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl',
        'animate-slide-up'
      )}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pt-2 pb-2">
          <PinPad
            title={t('pin_title')}
            subtitle={t('pin_subtitle')}
            onComplete={verifyPin}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  )
}
