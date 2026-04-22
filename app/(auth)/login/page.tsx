'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Lock, Phone, Wallet } from 'lucide-react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import toast from 'react-hot-toast'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [form, setForm] = useState({ phone: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await signIn('credentials', {
      phone: form.phone,
      password: form.password,
      redirect: false,
      callbackUrl,
    })

    setLoading(false)

    if (result?.error) {
      toast.error(result.error === 'CredentialsSignin'
        ? 'Numéro ou mot de passe incorrect'
        : result.error
      )
    } else if (result?.ok) {
      toast.success('Connexion réussie !')
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Numéro de téléphone"
        type="tel"
        placeholder="0555 000 000"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        leftIcon={<Phone className="w-4 h-4" />}
        hint="Format: 0555 000 000 ou +213 555 000 000"
        required
        autoComplete="tel"
      />
      <Input
        label="Mot de passe"
        type={showPassword ? 'text' : 'password'}
        placeholder="••••••••"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        leftIcon={<Lock className="w-4 h-4" />}
        rightIcon={showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        onRightIconClick={() => setShowPassword(!showPassword)}
        required
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-brand-500 rounded" />
          Se souvenir de moi
        </label>
        <Link href="/forgot-password" className="text-sm text-brand-600 hover:underline">
          Mot de passe oublié ?
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full mt-2" loading={loading}>
        Se connecter
      </Button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-card">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenue sur <span className="text-brand-500">ECOPYE</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Connectez-vous à votre portefeuille</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-gray-100">
          <Suspense fallback={<div className="h-48 animate-pulse bg-gray-50 rounded-xl" />}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Démo */}
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm">
          <p className="font-semibold text-amber-800 mb-1">💡 Compte de démo</p>
          <p className="text-amber-700">Téléphone: <code className="bg-amber-100 px-1 rounded">+213555000001</code></p>
          <p className="text-amber-700">Mot de passe: <code className="bg-amber-100 px-1 rounded">password123</code></p>
        </div>

        {/* Inscription */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-brand-600 font-semibold hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}
