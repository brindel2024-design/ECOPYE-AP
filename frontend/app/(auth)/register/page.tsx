'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, User, ArrowLeft, CheckCircle } from 'lucide-react'
import { api, setToken } from '@/lib/api'
import { useAppStore } from '@/lib/store'

type Step = 'phone' | 'otp' | 'name' | 'pin' | 'done'

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useAppStore()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('+213')
  const [otp, setOtp] = useState('')
  const [fullName, setFullName] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [confirmStep, setConfirmStep] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const sendOTP = async () => {
    if (!/^\+213[5-7]\d{8}$/.test(phone)) return setError('Numéro algérien invalide')
    setLoading(true)
    setError('')
    try {
      await api.sendOTP(phone, 'register')
      setStep('otp')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur envoi OTP') }
    finally { setLoading(false) }
  }

  const verifyOTP = () => {
    if (otp.length !== 6) return setError('Code à 6 chiffres')
    setError('')
    setStep('name')
  }

  const handleRegister = async () => {
    if (pin !== pinConfirm) return setError('Les PIN ne correspondent pas')
    setLoading(true)
    setError('')
    try {
      const res = await api.register({ phone, fullName, pin, otpCode: otp })
      setToken(res.token)
      setUser(res.user)
      setStep('done')
      setTimeout(() => router.push('/face-setup'), 1500)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Erreur création compte') }
    finally { setLoading(false) }
  }

  const steps = ['phone', 'otp', 'name', 'pin']
  const stepIndex = steps.indexOf(step)

  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      {/* Progress bar */}
      {step !== 'done' && (
        <div className="h-1 bg-surface-muted mt-safe-top">
          <div
            className="h-full bg-gradient-brand transition-all duration-500"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      )}

      <div className="flex-1 px-6 pt-8 flex flex-col gap-6">
        {/* Back button */}
        {stepIndex > 0 && step !== 'done' && (
          <button onClick={() => setStep(steps[stepIndex - 1] as Step)} className="self-start tap-feedback">
            <ArrowLeft className="text-gray-400" size={24} />
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-6 flex-1"
          >
            {step === 'phone' && (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-white">Créer un compte</h2>
                  <p className="text-gray-400 text-sm mt-1">Entrez votre numéro algérien</p>
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    className="input-field pl-12" placeholder="+213XXXXXXXXX"
                    inputMode="tel" autoComplete="tel"
                  />
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button onClick={sendOTP} disabled={loading} className="btn-primary mt-auto mb-8">
                  {loading ? 'Envoi du code…' : 'Recevoir le code SMS'}
                </button>
              </>
            )}

            {step === 'otp' && (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-white">Code de vérification</h2>
                  <p className="text-gray-400 text-sm mt-1">Code envoyé au {phone}</p>
                </div>
                <input
                  type="number" value={otp} onChange={e => setOtp(e.target.value)}
                  className="input-field text-center text-3xl tracking-widest font-mono"
                  placeholder="000000" maxLength={6} inputMode="numeric" autoComplete="one-time-code"
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button onClick={verifyOTP} disabled={otp.length !== 6} className="btn-primary mt-auto mb-8">
                  Vérifier
                </button>
                <button onClick={sendOTP} className="text-brand-400 text-sm text-center">
                  Renvoyer le code
                </button>
              </>
            )}

            {step === 'name' && (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-white">Votre nom</h2>
                  <p className="text-gray-400 text-sm mt-1">Tel qu'il apparaîtra sur votre profil</p>
                </div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    className="input-field pl-12" placeholder="Prénom Nom"
                    autoComplete="name" autoFocus
                  />
                </div>
                <button onClick={() => { if (fullName.trim().length >= 3) { setError(''); setStep('pin') } else setError('Minimum 3 caractères') }} className="btn-primary mt-auto mb-8">
                  Continuer
                </button>
              </>
            )}

            {step === 'pin' && (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-white">{confirmStep ? 'Confirmez votre PIN' : 'Créez votre PIN'}</h2>
                  <p className="text-gray-400 text-sm mt-1">{confirmStep ? 'Répétez le code' : 'Code secret à 6 chiffres'}</p>
                </div>

                <div className="flex justify-center gap-4 my-4">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const current = confirmStep ? pinConfirm : pin
                    return <div key={i} className={`pin-dot ${i < current.length ? 'filled' : ''}`} />
                  })}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
                    <button key={i} disabled={k === ''}
                      onClick={() => {
                        const setter = confirmStep ? setPinConfirm : setPin
                        const current = confirmStep ? pinConfirm : pin
                        if (k === '⌫') setter(current.slice(0,-1))
                        else if (k !== '' && current.length < 6) {
                          const next = current + k
                          setter(next)
                          if (!confirmStep && next.length === 6) setConfirmStep(true)
                        }
                      }}
                      className={`h-16 rounded-2xl text-xl font-semibold tap-feedback transition-colors
                        ${k === '' ? 'invisible' : 'bg-surface-muted text-white active:bg-surface-border'}`}
                    >{k}</button>
                  ))}
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                {confirmStep && pinConfirm.length === 6 && (
                  <button onClick={handleRegister} disabled={loading} className="btn-primary">
                    {loading ? 'Création…' : 'Créer mon compte'}
                  </button>
                )}
              </>
            )}

            {step === 'done' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <CheckCircle className="text-brand-500" size={80} />
                <h2 className="text-2xl font-bold text-white">Compte créé !</h2>
                <p className="text-gray-400 text-center">Configuration de votre reconnaissance faciale…</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
