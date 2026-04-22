'use client'

import { useLanguage } from '@/lib/LanguageContext'
import { cn } from '@/lib/utils'
import { Delete, Fingerprint } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PinPadProps {
  title?: string
  subtitle?: string
  onComplete: (pin: string) => void
  onBiometric?: () => void
  loading?: boolean
  error?: string
}

export default function PinPad({ title, subtitle, onComplete, onBiometric, loading, error }: PinPadProps) {
  const { t } = useLanguage()
  const [pin, setPin] = useState('')
  const PIN_LENGTH = 4

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      onComplete(pin)
      setTimeout(() => setPin(''), 400)
    }
  }, [pin, onComplete])

  function press(digit: string) {
    if (pin.length < PIN_LENGTH && !loading) {
      setPin((p) => p + digit)
    }
  }

  function del() {
    setPin((p) => p.slice(0, -1))
  }

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['bio', '0', 'del'],
  ]

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xs mx-auto">
      {/* Titre */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">{title || t('pin_title')}</h2>
        <p className="text-sm text-gray-500 mt-1">{subtitle || t('pin_subtitle')}</p>
      </div>

      {/* Points indicateurs */}
      <div className="flex gap-4">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-4 h-4 rounded-full border-2 transition-all duration-200',
              i < pin.length
                ? 'bg-brand-500 border-brand-500 scale-110'
                : 'bg-transparent border-gray-300'
            )}
          />
        ))}
      </div>

      {/* Erreur */}
      {error && (
        <p className="text-sm text-red-500 font-medium animate-fade-in">⚠ {error}</p>
      )}

      {/* Clavier */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {keys.flat().map((key) => {
          if (key === 'del') {
            return (
              <button
                key="del"
                onClick={del}
                disabled={loading || pin.length === 0}
                className="h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-30"
              >
                <Delete className="w-5 h-5" />
              </button>
            )
          }
          if (key === 'bio') {
            return (
              <button
                key="bio"
                onClick={onBiometric}
                disabled={!onBiometric || loading}
                className={cn(
                  'h-16 rounded-2xl flex items-center justify-center transition-all',
                  onBiometric
                    ? 'bg-brand-50 text-brand-600 hover:bg-brand-100 active:scale-95'
                    : 'bg-transparent opacity-0 pointer-events-none'
                )}
              >
                <Fingerprint className="w-6 h-6" />
              </button>
            )
          }
          return (
            <button
              key={key}
              onClick={() => press(key)}
              disabled={loading}
              className="h-16 rounded-2xl bg-white border border-gray-200 text-2xl font-semibold text-gray-900 hover:bg-brand-50 hover:border-brand-200 active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
