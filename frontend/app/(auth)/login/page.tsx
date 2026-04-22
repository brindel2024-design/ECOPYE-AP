'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Phone, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { api, setToken } from '@/lib/api'
import { useAppStore } from '@/lib/store'

type Step = 'phone' | 'pin' | 'totp' | 'face'

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAppStore()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('+213')
  const [pin, setPin] = useState('')
  const [totp, setTotp] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePhoneNext = () => {
    if (!/^\+213[5-7]\d{8}$/.test(phone)) {
      setError('Numéro invalide. Format: +213XXXXXXXXX')
      return
    }
    setError('')
    setStep('pin')
  }

  const handleLogin = async () => {
    if (pin.length !== 6) return setError('PIN de 6 chiffres requis')
    setLoading(true)
    setError('')
    try {
      const res = await api.login(phone, pin)
      if (res.requireTotp) { setStep('totp'); return }
      setToken(res.token)
      setUser(res.user)
      if (res.requireFaceAuth) { setStep('face'); return }
      router.push('/home')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  const handleTotp = async () => {
    setLoading(true)
    try {
      const res = await api.login(phone, pin, totp)
      setToken(res.token)
      setUser(res.user)
      router.push('/home')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Code 2FA invalide')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center mb-4 shadow-lg shadow-brand-500/30">
          <span className="text-3xl font-bold text-white">E</span>
        </div>
        <h1 className="text-2xl font-bold text-white">EcoPye Pay</h1>
        <p className="text-gray-400 text-sm mt-1">Le paiement mobile en Algérie</p>
      </div>

      <motion.div
        className="flex-1 px-6 flex flex-col gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {step === 'phone' && (
          <>
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Connexion</h2>
              <p className="text-gray-400 text-sm">Entrez votre numéro de téléphone</p>
            </div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="input-field pl-12" placeholder="+213XXXXXXXXX"
                inputMode="tel" autoComplete="tel"
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button onClick={handlePhoneNext} className="btn-primary mt-auto mb-8">Continuer</button>
          </>
        )}

        {step === 'pin' && (
          <>
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Votre PIN</h2>
              <p className="text-gray-400 text-sm">{phone}</p>
            </div>

            {/* Affichage PIN points */}
            <div className="flex justify-center gap-4 my-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
              ))}
            </div>

            {/* Clavier numérique */}
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
                <button
                  key={i}
                  disabled={k === ''}
                  onClick={() => {
                    if (k === '⌫') setPin(p => p.slice(0,-1))
                    else if (k !== '' && pin.length < 6) setPin(p => p + k)
                  }}
                  className={`h-16 rounded-2xl text-xl font-semibold tap-feedback transition-colors
                    ${k === '' ? 'invisible' : 'bg-surface-muted text-white active:bg-surface-border'}`}
                >
                  {k}
                </button>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              onClick={handleLogin} disabled={pin.length !== 6 || loading}
              className="btn-primary"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </>
        )}

        {step === 'totp' && (
          <>
            <div className="flex flex-col items-center gap-4">
              <ShieldCheck className="text-brand-400" size={48} />
              <h2 className="text-xl font-semibold text-white">Authentification 2FA</h2>
              <p className="text-gray-400 text-sm text-center">Entrez le code de votre application Google Authenticator</p>
            </div>
            <input
              type="number" value={totp} onChange={e => setTotp(e.target.value)}
              className="input-field text-center text-2xl tracking-widest font-mono"
              placeholder="000000" maxLength={6} inputMode="numeric"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button onClick={handleTotp} disabled={totp.length !== 6 || loading} className="btn-primary">
              {loading ? 'Vérification…' : 'Confirmer'}
            </button>
          </>
        )}

        <div className="text-center pb-8">
          <span className="text-gray-500 text-sm">Pas encore de compte ? </span>
          <a href="/register" className="text-brand-400 text-sm font-medium">S'inscrire</a>
        </div>
      </motion.div>
    </div>
  )
}
