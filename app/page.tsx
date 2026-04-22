'use client'

import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Phone,
  QrCode,
  Send,
  Shield,
  Smartphone,
  Wallet,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: Send,
    title: 'Transfert Instantané',
    desc: 'Envoyez de l\'argent à n\'importe quel numéro algérien en quelques secondes',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: QrCode,
    title: 'Paiement QR Code',
    desc: 'Payez chez vos marchands partenaires en scannant simplement un QR code',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Wallet,
    title: 'Portefeuille DZD',
    desc: 'Gérez votre solde en dinars algériens avec un historique complet',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Shield,
    title: 'Sécurité Maximale',
    desc: 'Chiffrement de bout en bout et authentification à double facteur',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: CreditCard,
    title: 'CIB & BaridiMob',
    desc: 'Compatible avec CIB, Dahabia et BaridiMob pour recharger votre compte',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Zap,
    title: 'Disponible 24h/24',
    desc: 'Transférez, payez et gérez votre argent à toute heure, tous les jours',
    color: 'bg-cyan-50 text-cyan-600',
  },
]

const stats = [
  { value: '+50 000', label: 'Utilisateurs actifs' },
  { value: '500M+', label: 'DZD traités' },
  { value: '99.9%', label: 'Disponibilité' },
  { value: '< 3s', label: 'Temps de transfert' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl">
              <span className="text-gray-900">ECO</span>
              <span className="text-brand-500">PYE</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Se connecter</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Créer un compte</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 text-white relative overflow-hidden">
        {/* Cercles décoratifs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-gold-500/20 translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
            Disponible en Algérie · دفع إلكتروني
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Paiement électronique
            <br />
            <span className="text-gold-400">100% algérien</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl mx-auto">
            Transférez de l'argent, payez vos factures et gérez votre portefeuille
            en dinars algériens. Simple, rapide et sécurisé.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-brand-700 hover:bg-white/90 shadow-xl w-full sm:w-auto"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Commencer gratuitement
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/15 border-2 border-white/30 w-full sm:w-auto"
              >
                Déjà un compte ?
              </Button>
            </Link>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            {['Inscription gratuite', 'Sans frais cachés', 'Support 24/7'].map((badge) => (
              <div key={badge} className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-extrabold text-brand-600 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-surface-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-gray-500">
              Une solution complète pour tous vos besoins de paiement en Algérie
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-card transition-all duration-200 hover:-translate-y-1"
                >
                  <div className={`w-11 h-11 rounded-2xl ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Compatibilité */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Compatible avec tous vos moyens de paiement</h2>
          <p className="text-gray-500 mb-10">Rechargez votre portefeuille ECOPYE depuis vos comptes bancaires algériens</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'CIB', desc: 'Carte Interbancaire', icon: CreditCard },
              { name: 'BaridiMob', desc: 'Algérie Poste Mobile', icon: Smartphone },
              { name: 'Dahabia', desc: 'Carte CCP', icon: CreditCard },
              { name: 'Virement', desc: 'Banques agréées', icon: Building2 },
            ].map((method) => {
              const Icon = method.icon
              return (
                <div key={method.name} className="bg-surface-50 rounded-2xl p-5 border border-gray-100 text-center">
                  <Icon className="w-8 h-8 text-brand-500 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900 text-sm">{method.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{method.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-brand text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Rejoignez des milliers d'Algériens
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            Créez votre compte gratuitement en moins de 2 minutes.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-white text-brand-700 hover:bg-white/90 shadow-xl"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Créer mon compte ECOPYE
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400 text-center text-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-base">ECOPYE</span>
          </div>
          <p>© 2025 ECOPYE — Paiement électronique algérien. Tous droits réservés.</p>
          <p className="mt-2 text-xs">Agréé par la Banque d'Algérie · Certifié PCI DSS</p>
        </div>
      </footer>
    </div>
  )
}
