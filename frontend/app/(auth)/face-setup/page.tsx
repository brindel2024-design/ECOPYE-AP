'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShieldCheck, SkipForward } from 'lucide-react'
import FaceAuth from '@/components/face/FaceAuth'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'

export default function FaceSetupPage() {
  const router = useRouter()
  const { setUser } = useAppStore()
  const [status, setStatus] = useState<'intro' | 'scan' | 'done'>('intro')
  const [error, setError] = useState('')

  const handleFaceSuccess = async (descriptor: number[]) => {
    try {
      await api.setupFace(descriptor)
      const me = await api.me()
      setUser(me)
      setStatus('done')
      setTimeout(() => router.push('/home'), 1500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur configuration faciale')
      setStatus('intro')
    }
  }

  return (
    <div className="min-h-dvh bg-surface flex flex-col px-6 pt-12">
      {status === 'intro' && (
        <motion.div
          className="flex flex-col items-center gap-6 flex-1"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-24 h-24 rounded-full bg-brand-500/20 flex items-center justify-center">
            <ShieldCheck className="text-brand-400" size={48} />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Reconnaissance faciale</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Sécurisez votre compte avec votre visage. Utilisé pour confirmer les transferts importants.
            </p>
          </div>

          <div className="card w-full space-y-3">
            {[
              'Détection de vivacité anti-spoofing',
              'Descripteur chiffré AES-256',
              'Jamais envoyé à des tiers',
              'Compatible Android & iOS'
            ].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-sm text-gray-300">{f}</span>
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <div className="flex flex-col gap-3 w-full mt-auto mb-8">
            <button onClick={() => setStatus('scan')} className="btn-primary">
              Configurer maintenant
            </button>
            <button onClick={() => router.push('/home')} className="btn-secondary flex items-center justify-center gap-2 text-gray-400">
              <SkipForward size={16} />
              Plus tard
            </button>
          </div>
        </motion.div>
      )}

      {status === 'scan' && (
        <motion.div
          className="flex flex-col items-center gap-6 flex-1"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <h2 className="text-xl font-bold text-white self-start">Enregistrement du visage</h2>
          <FaceAuth mode="enroll" onSuccess={handleFaceSuccess} onError={setError} />
        </motion.div>
      )}

      {status === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-24 h-24 rounded-full bg-brand-500/20 flex items-center justify-center">
            <ShieldCheck className="text-brand-500" size={56} />
          </div>
          <h2 className="text-2xl font-bold text-white">Visage enregistré !</h2>
          <p className="text-gray-400 text-sm">Redirection vers votre espace…</p>
        </div>
      )}
    </div>
  )
}
