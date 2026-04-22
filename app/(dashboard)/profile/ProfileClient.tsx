'use client'

import { Button } from '@/components/ui/button'
import { formatDZD } from '@/lib/utils'
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  Lock,
  LogOut,
  Phone,
  QrCode,
  ScanFace,
  Shield,
  ShieldCheck,
  Star,
  User,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
  user: {
    fullName: string
    phone: string
    email: string
    isVerified: boolean
    createdAt: string
    faceEnrolled: boolean
    totpEnabled: boolean
  }
  balance: number
  txCount: number
}

export default function ProfileClient({ user, balance, txCount }: Props) {
  const router = useRouter()
  const [totp2FASetup, setTotp2FASetup] = useState(false)
  const [totpQR, setTotpQR] = useState('')
  const [totpToken, setTotpToken] = useState('')
  const [totpLoading, setTotpLoading] = useState(false)
  const [faceLoading, setFaceLoading] = useState(false)

  const joinDate = new Date(user.createdAt).toLocaleDateString('fr-DZ', {
    month: 'long',
    year: 'numeric',
  })

  async function startTOTPSetup() {
    setTotpLoading(true)
    try {
      const res = await fetch('/api/auth/totp', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTotpQR(data.qrCode)
      setTotp2FASetup(true)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur configuration TOTP')
    } finally {
      setTotpLoading(false)
    }
  }

  async function verifyTOTP() {
    if (totpToken.length !== 6) {
      toast.error('Code à 6 chiffres requis')
      return
    }
    setTotpLoading(true)
    try {
      const res = await fetch('/api/auth/totp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totpToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('2FA activé avec succès !')
      setTotp2FASetup(false)
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Code incorrect')
    } finally {
      setTotpLoading(false)
    }
  }

  async function removeFace() {
    setFaceLoading(true)
    try {
      const res = await fetch('/api/auth/face', { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur suppression')
      toast.success('Reconnaissance faciale supprimée')
      router.refresh()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setFaceLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Profil */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-brand rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {user.fullName.charAt(0)}
            </div>
            {user.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
            <p className="text-sm text-gray-500">{user.phone}</p>
            {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
            <div className="flex items-center gap-1.5 mt-1">
              {user.isVerified ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Compte vérifié</span>
                </>
              ) : (
                <span className="text-xs text-amber-600">Non vérifié</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">Membre depuis {joinDate}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Solde',        value: formatDZD(balance), color: 'text-brand-600' },
          { label: 'Transactions', value: txCount.toString(), color: 'text-gray-900' },
          { label: 'Statut',       value: user.isVerified ? 'Vérifié' : 'Basique', color: user.isVerified ? 'text-green-600' : 'text-amber-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-3 text-center border border-gray-100 shadow-sm">
            <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Sécurité biométrique */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 border-b border-gray-50">
          Sécurité biométrique
        </p>

        {/* Reconnaissance faciale */}
        <div className="px-4 py-4 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user.faceEnrolled ? 'bg-green-50' : 'bg-gray-100'}`}>
              <ScanFace className={`w-5 h-5 ${user.faceEnrolled ? 'text-green-600' : 'text-gray-500'}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Reconnaissance faciale</p>
              <p className="text-xs text-gray-400">
                {user.faceEnrolled ? 'Activée — confirme vos transactions' : 'Non configurée'}
              </p>
            </div>
            {user.faceEnrolled ? (
              <button
                onClick={removeFace}
                disabled={faceLoading}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                {faceLoading ? '…' : 'Supprimer'}
              </button>
            ) : (
              <button
                onClick={() => router.push('/face-setup')}
                className="text-xs text-brand-600 font-semibold px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 transition-colors"
              >
                Configurer
              </button>
            )}
          </div>
        </div>

        {/* TOTP 2FA */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${user.totpEnabled ? 'bg-green-50' : 'bg-amber-50'}`}>
              <ShieldCheck className={`w-5 h-5 ${user.totpEnabled ? 'text-green-600' : 'text-amber-500'}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Authentification TOTP</p>
              <p className="text-xs text-gray-400">
                {user.totpEnabled ? 'Activée — Google Authenticator' : 'Recommandé pour votre sécurité'}
              </p>
            </div>
            {!user.totpEnabled && !totp2FASetup && (
              <button
                onClick={startTOTPSetup}
                disabled={totpLoading}
                className="text-xs text-amber-700 font-semibold px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                {totpLoading ? '…' : 'Activer'}
              </button>
            )}
            {user.totpEnabled && (
              <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Actif
              </span>
            )}
          </div>

          {/* QR setup flow */}
          {totp2FASetup && totpQR && (
            <div className="mt-4 p-4 bg-gray-50 rounded-2xl space-y-4">
              <p className="text-xs font-semibold text-gray-700 text-center">
                Scannez avec Google Authenticator
              </p>
              <img src={totpQR} alt="TOTP QR Code" className="mx-auto rounded-xl w-44 h-44" />
              <div className="space-y-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Code à 6 chiffres"
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-2xl font-mono tracking-[0.4em] py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setTotp2FASetup(false)}
                    className="flex-1 py-2.5 text-sm text-gray-500 rounded-xl border border-gray-200 hover:bg-gray-100"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={verifyTOTP}
                    disabled={totpLoading || totpToken.length !== 6}
                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-gradient-brand rounded-xl disabled:opacity-50"
                  >
                    {totpLoading ? 'Vérification…' : 'Confirmer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compte */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 border-b border-gray-50">
          Compte
        </p>
        <div className="divide-y divide-gray-50">
          {[
            { icon: User,  label: 'Modifier mon profil',  href: '#' },
            { icon: Lock,  label: 'Changer le mot de passe', href: '#' },
            { icon: Phone, label: 'Changer le numéro',    href: '#' },
          ].map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => toast('Fonctionnalité bientôt disponible', { icon: '🚀' })}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Icon className="w-4 h-4 text-gray-600" />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-800">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Services */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 border-b border-gray-50">
          Services
        </p>
        <div className="divide-y divide-gray-50">
          {[
            { icon: QrCode,  label: 'Mon QR Code',              action: () => router.push('/pay') },
            { icon: Shield,  label: 'Historique de sécurité',   action: () => toast('Bientôt disponible', { icon: '🔐' }) },
            { icon: CreditCard, label: 'Cartes et comptes',     action: () => toast('Bientôt disponible', { icon: '💳' }) },
            { icon: Bell,    label: 'Notifications',            action: () => toast('Bientôt disponible', { icon: '🔔' }) },
          ].map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Icon className="w-4 h-4 text-gray-600" />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-800">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Aide */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 border-b border-gray-50">
          Aide
        </p>
        <div className="divide-y divide-gray-50">
          {[
            { icon: HelpCircle, label: 'Centre d\'aide',           action: () => toast('Bientôt disponible') },
            { icon: Star,       label: 'Évaluer l\'application',   action: () => toast('Bientôt disponible') },
            { icon: FileText,   label: 'Conditions d\'utilisation', action: () => toast('Bientôt disponible') },
          ].map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Icon className="w-4 h-4 text-gray-600" />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-800">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Déconnexion */}
      <Button
        variant="danger"
        size="lg"
        className="w-full"
        onClick={() => signOut({ callbackUrl: '/login' })}
        leftIcon={<LogOut className="w-4 h-4" />}
      >
        Se déconnecter
      </Button>

      <p className="text-center text-xs text-gray-400 pb-2">
        EcoPye v1.0.0 · © 2025 Tous droits réservés
      </p>
    </div>
  )
}
