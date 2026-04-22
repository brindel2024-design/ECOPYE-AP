'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import FaceAuth from '@/components/face/FaceAuth'

type Step = 'search' | 'amount' | 'pin' | 'face' | 'done' | 'error'

interface Recipient { id: string; fullName: string; phone: string }

const formatDZD = (n: number) =>
  new Intl.NumberFormat('fr-DZ', { minimumFractionDigits: 2 }).format(n) + ' DZD'

export default function TransferPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('search')
  const [phone, setPhone] = useState('')
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [pin, setPin] = useState('')
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [txRef, setTxRef] = useState('')

  const quickAmounts = [1000, 2000, 5000, 10000]

  const handleLookup = async () => {
    if (!/^\+213[5-7]\d{8}$/.test(phone)) return setError('Format: +213XXXXXXXXX')
    setLoading(true); setError('')
    try {
      const res = await api.lookupUser(phone)
      setRecipient(res.user)
      setStep('amount')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Utilisateur introuvable') }
    finally { setLoading(false) }
  }

  const handleSend = async (descriptor?: number[]) => {
    setLoading(true); setError('')
    try {
      const res = await api.sendMoney({
        receiverPhone: recipient!.phone,
        amount: Number(amount),
        pin,
        note,
        faceDescriptor: descriptor || faceDescriptor
      })
      setTxRef(res.transaction.reference)
      setStep('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Échec du transfert')
      setStep('error')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-dvh bg-surface px-5 pt-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => step === 'search' ? router.back() : setStep('search')} className="tap-feedback">
          <ArrowLeft size={24} className="text-gray-400" />
        </button>
        <h1 className="text-xl font-bold text-white">Envoyer de l'argent</h1>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
        >
          {/* Étape 1 : Recherche destinataire */}
          {step === 'search' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-medium text-gray-300 mb-4">Numéro du destinataire</h2>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    className="input-field pl-12" placeholder="+213XXXXXXXXX"
                    inputMode="tel" autoComplete="off"
                    onKeyDown={e => e.key === 'Enter' && handleLookup()}
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</p>}
              <button onClick={handleLookup} disabled={loading} className="btn-primary">
                {loading ? 'Recherche…' : 'Trouver le compte'}
              </button>
            </div>
          )}

          {/* Étape 2 : Montant */}
          {step === 'amount' && recipient && (
            <div className="space-y-6">
              {/* Destinataire */}
              <div className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-brand flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{recipient.fullName[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-white">{recipient.fullName}</p>
                  <p className="text-sm text-gray-500">{recipient.phone}</p>
                </div>
              </div>

              {/* Saisie montant */}
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-2">
                  <input
                    type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    className="bg-transparent text-white text-5xl font-bold w-full text-center border-none outline-none"
                    placeholder="0" inputMode="decimal" min="100"
                  />
                  <span className="text-xl text-gray-500 font-medium">DZD</span>
                </div>
                <div className="h-px bg-surface-border mt-2" />
              </div>

              {/* Montants rapides */}
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map(a => (
                  <button
                    key={a}
                    onClick={() => setAmount(String(a))}
                    className={`py-2 rounded-xl text-sm font-medium tap-feedback transition-colors
                      ${amount === String(a) ? 'bg-brand-500 text-white' : 'bg-surface-muted text-gray-400'}`}
                  >
                    {(a/1000).toFixed(0)}K
                  </button>
                ))}
              </div>

              {/* Note optionnelle */}
              <input
                type="text" value={note} onChange={e => setNote(e.target.value)}
                className="input-field" placeholder="Note (optionnel)"
                maxLength={140}
              />

              <button
                onClick={() => { if (Number(amount) >= 100) { setError(''); setStep('pin') } else setError('Minimum 100 DZD') }}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Send size={18} />
                Envoyer {amount ? formatDZD(Number(amount)) : ''}
              </button>
            </div>
          )}

          {/* Étape 3 : PIN */}
          {step === 'pin' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Confirmation de</p>
                <p className="text-3xl font-bold text-white mt-1">{formatDZD(Number(amount))}</p>
                <p className="text-sm text-gray-500 mt-1">→ {recipient?.fullName}</p>
              </div>

              <div className="flex justify-center gap-4 my-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
                  <button key={i} disabled={k === ''}
                    onClick={() => {
                      if (k === '⌫') setPin(p => p.slice(0,-1))
                      else if (k !== '' && pin.length < 6) {
                        const next = pin + k
                        setPin(next)
                        if (next.length === 6) setStep('face')
                      }
                    }}
                    className={`h-16 rounded-2xl text-xl font-semibold tap-feedback
                      ${k === '' ? 'invisible' : 'bg-surface-muted text-white active:bg-surface-border'}`}
                  >{k}</button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 4 : Vérification faciale */}
          {step === 'face' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-400">Confirmez avec votre visage</p>
                <p className="text-xl font-bold text-white mt-1">{formatDZD(Number(amount))} → {recipient?.fullName}</p>
              </div>
              <FaceAuth
                mode="verify"
                onSuccess={d => { setFaceDescriptor(d); handleSend(d) }}
                onError={msg => { setError(msg); setStep('error') }}
              />
              <button onClick={() => handleSend()} className="btn-secondary text-gray-400 text-sm">
                Ignorer la vérification faciale
              </button>
            </div>
          )}

          {/* Succès */}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-6 pt-12">
              <CheckCircle className="text-brand-500" size={80} />
              <h2 className="text-2xl font-bold text-white">Envoi réussi !</h2>
              <div className="card w-full text-center space-y-2">
                <p className="text-gray-400 text-sm">Montant envoyé</p>
                <p className="text-2xl font-bold text-brand-400">{formatDZD(Number(amount))}</p>
                <p className="text-gray-400 text-sm">à {recipient?.fullName}</p>
                <p className="text-xs text-gray-600 font-mono mt-2">{txRef}</p>
              </div>
              <button onClick={() => router.push('/home')} className="btn-primary">
                Retour à l'accueil
              </button>
            </div>
          )}

          {/* Erreur */}
          {step === 'error' && (
            <div className="flex flex-col items-center gap-6 pt-12">
              <AlertCircle className="text-red-400" size={80} />
              <h2 className="text-xl font-bold text-white">Transfert échoué</h2>
              <p className="text-gray-400 text-center text-sm">{error}</p>
              <button onClick={() => setStep('amount')} className="btn-primary">Réessayer</button>
              <button onClick={() => router.push('/home')} className="btn-secondary">Retour</button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
