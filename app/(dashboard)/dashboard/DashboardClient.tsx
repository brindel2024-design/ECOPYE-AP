'use client'

import TransactionItem from '@/components/TransactionItem'
import WalletCard from '@/components/WalletCard'
import {
  ArrowRight,
  Building2,
  Droplets,
  History,
  QrCode,
  Receipt,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

interface Props {
  user: { fullName: string; phone: string }
  wallet: { balance: number } | null
  recentTransfers: any[]
  recentPayments: any[]
  monthlyIn: number
  monthlyOut: number
  userId: string
}

const quickActions = [
  { icon: Send,    label: 'Envoyer',    href: '/transfer', bg: 'bg-brand-50',    fg: 'text-brand-600' },
  { icon: Wallet,  label: 'Recharger',  href: '/topup',    bg: 'bg-success-50',  fg: 'text-success-600' },
  { icon: QrCode,  label: 'QR Code',    href: '/pay',      bg: 'bg-gold-50',     fg: 'text-gold-600' },
  { icon: Receipt, label: 'Factures',   href: '/bills',    bg: 'bg-surface-100', fg: 'text-ink-primary' },
]

const billServices = [
  { icon: Smartphone, label: 'Djezzy',    color: 'bg-red-50 text-red-500' },
  { icon: Wifi,       label: 'Mobilis',   color: 'bg-brand-50 text-brand-600' },
  { icon: Smartphone, label: 'Ooredoo',   color: 'bg-red-50 text-red-600' },
  { icon: Zap,        label: 'Sonelgaz',  color: 'bg-gold-50 text-gold-600' },
  { icon: Droplets,   label: 'Seaal',     color: 'bg-cyan-50 text-cyan-600' },
  { icon: Building2,  label: 'Autre',     color: 'bg-surface-100 text-ink-secondary' },
]

export default function DashboardClient({
  user,
  wallet,
  recentTransfers,
  recentPayments,
  monthlyIn,
  monthlyOut,
  userId,
}: Props) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const firstName = user.fullName.split(' ')[0]

  const allTransactions = [
    ...recentTransfers.map((t) => ({
      id: t.id,
      type: t.senderId === userId ? 'sent' : ('received' as any),
      title: t.senderId === userId ? t.receiver.fullName : t.sender.fullName,
      subtitle: t.description,
      amount: Number(t.amount),
      status: t.status,
      date: t.createdAt,
    })),
    ...recentPayments.map((p) => ({
      id: p.id,
      type: 'payment' as const,
      title: p.merchantName,
      subtitle: p.description,
      amount: Number(p.amount),
      status: p.status,
      date: p.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      {/* Salutation */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-ink-secondary text-sm font-medium">{greeting},</p>
          <h1 className="text-2xl font-extrabold text-ink-primary tracking-tight">
            {firstName} <span className="inline-block">👋</span>
          </h1>
        </div>
        <Link
          href="/profile"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-50 border border-success-100"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-success-600" />
          <span className="text-[11px] font-semibold text-success-700">Vérifié</span>
        </Link>
      </div>

      {/* Carte portefeuille */}
      <WalletCard
        balance={Number(wallet?.balance ?? 0)}
        ownerName={user.fullName}
        phone={user.phone}
        monthlyIn={monthlyIn}
        monthlyOut={monthlyOut}
      />

      {/* Actions rapides */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-bold text-ink-primary text-base">Actions rapides</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.label} href={action.href} className="quick-action">
                <div className={`action-icon ${action.bg}`}>
                  <Icon className={`w-5 h-5 ${action.fg}`} />
                </div>
                <span className="text-[11px] font-semibold text-ink-primary text-center leading-tight">
                  {action.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Paiement de factures — chips horizontales scrollables */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-bold text-ink-primary text-base">Paiement de factures</h2>
          <Link href="/bills" className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:gap-1.5 transition-all">
            Voir tout <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
          {billServices.map((service) => {
            const Icon = service.icon
            return (
              <Link key={service.label} href="/bills" className="operator-chip">
                <div className={`w-11 h-11 rounded-xl ${service.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-ink-primary">{service.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bannière promotionnelle — or saharien */}
      <div className="relative rounded-2xl p-5 bg-gradient-to-br from-gold-500 to-gold-600 text-white overflow-hidden shadow-card">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute -right-4 bottom-0 opacity-20">
          <Sparkles className="w-24 h-24" />
        </div>
        <div className="relative">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur mb-2">
            <Sparkles className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Offre spéciale</span>
          </div>
          <h3 className="font-extrabold text-xl mb-1 tracking-tight">0% de frais ce mois-ci</h3>
          <p className="text-white/90 text-sm mb-4 max-w-[240px]">
            Transférez jusqu'à 100 000 DZD sans frais, profitez-en !
          </p>
          <Link
            href="/transfer"
            className="inline-flex items-center gap-1.5 bg-white text-gold-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-white/95 active:scale-[0.98] transition-all shadow-sm"
          >
            Transférer maintenant
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Transactions récentes */}
      <div className="page-section !p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-surface-200">
          <h2 className="font-bold text-ink-primary text-base">Dernière activité</h2>
          <Link href="/history" className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:gap-1.5 transition-all">
            Tout voir <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-surface-100 px-2 py-1">
          {allTransactions.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-surface-100 flex items-center justify-center">
                <History className="w-6 h-6 text-ink-muted" />
              </div>
              <p className="text-sm font-semibold text-ink-primary mb-1">Aucune transaction</p>
              <p className="text-xs text-ink-secondary">Vos dernières opérations apparaîtront ici</p>
            </div>
          ) : (
            allTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                type={tx.type}
                title={tx.title}
                subtitle={tx.subtitle}
                amount={tx.amount}
                status={tx.status}
                date={tx.date}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
