'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isValidAlgerianPhone } from '@/lib/utils'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Phone,
  User,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

const steps = ['Informations', 'Sécurité', 'Confirmation']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  })

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function validateStep0() {
    const newErrors: Record<string, string> = {}
    if (!form.fullName.trim() || form.fullName.length < 3) {
      newErrors.fullName = 'Nom complet requis (minimum 3 caractères)'
    }
    if (!isValidAlgerianPhone(form.phone)) {
      newErrors.phone = 'Numéro algérien invalide (ex: 0555 000 000)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function validateStep1() {
    const newErrors: Record<string, string> = {}
    if (form.password.length < 8) {
      newErrors.password = 'Mot de passe minimum 8 caractères'
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }
    if (!form.acceptTerms) {
      newErrors.acceptTerms = 'Vous devez accepter les conditions'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email || undefined,
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de l\'inscription')
        return
      }

      setStep(2)
      toast.success('Compte créé avec succès !')
    } catch {
      toast.error('Erreur de connexion. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-card">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-gray-500 text-sm mt-1">Rejoignez la communauté ECOPYE</p>
        </div>

        {/* Stepper */}
        {step < 2 && (
          <div className="flex items-center mb-6 px-2">
            {steps.slice(0, 2).map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${i <= step ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`ml-2 text-xs font-medium ${i === step ? 'text-brand-600' : 'text-gray-400'}`}>
                  {s}
                </span>
                {i < 1 && <div className="flex-1 h-0.5 mx-2 bg-gray-200 rounded" />}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100">
          {/* Étape 0: Informations */}
          {step === 0 && (
            <div className="space-y-4">
              <Input
                label="Nom complet"
                placeholder="Ex: Youcef Benali"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                error={errors.fullName}
                required
              />
              <Input
                label="Numéro de téléphone"
                type="tel"
                placeholder="0555 000 000"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
                hint="Votre numéro Djezzy, Mobilis ou Ooredoo"
                error={errors.phone}
                required
              />
              <Input
                label="Email (optionnel)"
                type="email"
                placeholder="votre@email.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                hint="Pour recevoir vos relevés de compte"
              />
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => validateStep0() && setStep(1)}
              >
                Continuer
              </Button>
            </div>
          )}

          {/* Étape 1: Sécurité */}
          {step === 1 && (
            <div className="space-y-4">
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 caractères"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                onRightIconClick={() => setShowPassword(!showPassword)}
                error={errors.password}
                required
              />
              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="Répétez votre mot de passe"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword}
                required
              />

              {/* Conditions */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.acceptTerms}
                  onChange={(e) => update('acceptTerms', e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-brand-500"
                />
                <span className="text-sm text-gray-600">
                  J'accepte les{' '}
                  <Link href="/terms" className="text-brand-600 hover:underline">
                    conditions d'utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link href="/privacy" className="text-brand-600 hover:underline">
                    politique de confidentialité
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-red-500">{errors.acceptTerms}</p>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep(0)}
                >
                  Retour
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="flex-1"
                  loading={loading}
                  onClick={() => validateStep1() && handleSubmit()}
                >
                  S'inscrire
                </Button>
              </div>
            </div>
          )}

          {/* Étape 2: Succès */}
          {step === 2 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Compte créé !</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Bienvenue sur ECOPYE, {form.fullName.split(' ')[0]} !
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Votre portefeuille a été créé avec un solde de départ.
                </p>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={() => router.push('/login')}
              >
                Se connecter
              </Button>
            </div>
          )}
        </div>

        {step < 2 && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà inscrit ?{' '}
            <Link href="/login" className="text-brand-600 font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
