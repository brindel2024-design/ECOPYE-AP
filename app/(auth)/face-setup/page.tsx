'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, SkipForward, AlertTriangle, CheckCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'

const FaceCapture = dynamic(() => import('@/components/FaceCapture'), { ssr: false })

type Step = 'intro' | 'scan' | 'success'

const features = [
  { icon: '🔐', label: 'Chiffrement AES-256-GCM',    desc: 'Vos données faciales sont chiffrées localement' },
  { icon: '👁️', label: 'Détection de vivacité',       desc: 'Impossible d\'utiliser une photo ou vidéo' },
  { icon: '⚡', label: 'Confirmation instantanée',    desc: 'Autorisez les transferts en un regard' },
  { icon: '🔒', label: 'Jamais partagé',              desc: 'Vos données restent sur nos serveurs sécurisés' },
]

export default function FaceSetupPage() {
  const router  = useRouter()
  const [step,  setStep]  = useState<Step>('intro')
  const [error, setError] = useState('')

  const handleSuccess = async (descriptor: number[]) => {
    try {
      const res = await fetch('/api/auth/face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptor }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setStep('success')
      toast.success('Reconnaissance faciale configurée !')
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur enregistrement')
      toast.error('Échec de l\'enregistrement facial')
      setStep('intro')
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Logo */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center mx-auto mb-4 shadow-wallet">
                  <ShieldCheck className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Reconnaissance faciale</h1>
                <p className="text-gray-500 text-sm mt-1">Sécurité biométrique de niveau bancaire</p>
              </div>

              {/* Features */}
              <div className="bg-white rounded-3xl p-5 shadow-card border border-gray-100 space-y-4">
                {features.map((f) => (
                  <div key={f.label} className="flex items-start gap-3">
                    <span className="text-xl">{f.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{f.label}</p>
                      <p className="text-xs text-gray-500">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl p-3">
                  <AlertTriangle className="text-red-500 flex-shrink-0" size={16} />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => setStep('scan')}
                  className="w-full py-4 bg-gradient-brand text-white font-semibold rounded-2xl shadow-card hover:shadow-card-hover active:scale-95 transition-all"
                >
                  Configurer maintenant
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-4 flex items-center justify-center gap-2 bg-surface-100 text-gray-500 font-medium rounded-2xl hover:bg-surface-200 active:scale-95 transition-all"
                >
                  <SkipForward size={16} /> Plus tard
                </button>
              </div>
            </motion.div>
          )}

          {step === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">Enregistrement du visage</h2>
                <p className="text-gray-500 text-sm mt-1">Restez face à la caméra dans un endroit bien éclairé</p>
              </div>
              <FaceCapture
                mode="enroll"
                onSuccess={handleSuccess}
                onError={(msg) => { setError(msg); setStep('intro') }}
              />
              <button onClick={() => setStep('intro')} className="w-full text-sm text-gray-400 py-2 hover:text-gray-600">
                ← Retour
              </button>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-success-50 flex items-center justify-center mx-auto">
                <CheckCircle className="text-success-500" size={56} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Visage enregistré !</h2>
                <p className="text-gray-500 text-sm mt-1">Redirection vers votre tableau de bord…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
