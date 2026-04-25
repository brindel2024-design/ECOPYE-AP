'use client'

import TransactionItem from '@/components/TransactionItem'
import WalletCard from '@/components/WalletCard'
import { formatDZD } from '@/lib/utils'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Droplets,
  History,
  QrCode,
  Receipt,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
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
  {
    icon: Send,
    label: 'Envoyer',
    hint: 'Transfert instantané',
    href: '/transfer',
    accent: 'brand',
  },
  {
    icon: Wallet,
    label: 'Recharger',
    hint: 'Alimenter le portefeuille',
    href: '/topup',
    accent: 'success',
  },
  {
    icon: QrCode,
    label: 'Scanner',
    hint: 'Payer un marchand',
    href: '/pay',
    accent: 'gold',
  },
  {
    icon: Receipt,
    label: 'Factures',
    hint: 'Régler vos opérateurs',
    href: '/bills',
    accent: 'ink',
  },
] as const

const billServices = [
  { icon: Smartphone, label: 'Djezzy',   color: 'bg-red-50 text-red-500' },
  { icon: Wifi,       label: 'Mobilis',  color: 'bg-brand-50 text-brand-600' },
  { icon: Smartphone, label: 'Ooredoo',  color: 'bg-red-50 text-red-600' },
  { icon: Zap,        label: 'Sonelgaz', color: 'bg-gold-50 text-gold-600' },
  { icon: Droplets,   label: 'Seaal',    color: 'bg-cyan-50 text-cyan-600' },
  { icon: Building2,  label: 'Autre',    color: 'bg-surface-100 text-ink-secondary' },
]

const accentStyles = {
  brand:   { tile: 'hover:border-brand-300 hover:shadow-card',          iconBg: 'bg-brand-50',   iconFg: 'text-brand-600',   glow: 'from-brand-500/10' },
  success: { tile: 'hover:border-success-500/40 hover:shadow-card',     iconBg: 'bg-success-50', iconFg: 'text-success-600', glow: 'from-success-500/10' },
  gold:    { tile: 'hover:border-gold-300 hover:shadow-card',           iconBg: 'bg-gold-50',    iconFg: 'text-gold-600',    glow: 'from-gold-500/10' },
  ink:     { tile: 'hover:border-surface-300 hover:shadow-soft',        iconBg: 'bg-surface-100',iconFg: 'text-ink-primary', glow: 'from-surface-300/20' },
} as const

function Sparkline({ points, gradientId }: { points: number[]; gradientId: string }) {
  if (points.length < 2) {
    return <div className="h-8 w-full" aria-hidden />
  }
  const max = Math.max(...points, 1)
  const min = Math.min(...points, 0)
  const range = max - min || 1
  const w = 100
  const h = 32
  const pts = points.map((p, i) => ({
    x: (i / (points.length - 1)) * w,
    y: h - ((p - min) / range) * h,
  }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `M0,${h} ${pts.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} L${w},${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-8" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function formatDayLabel(d: Date) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (day.getTime() === today.getTime()) return "Aujourd'hui"
  if (day.getTime() === yesterday.getTime()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
}

function buildSparkline(items: { amount: number; date: string | Date }[], days = 7) {
  const now = new Date()
  const buckets = Array(days).fill(0)
  for (const it of items) {
    const d = new Date(it.date)
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diff >= 0 && diff < days) {
      buckets[days - 1 - diff] += Number(it.amount)
    }
  }
  return buckets
}

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

  const inItems = recentTransfers
    .filter((t) => t.receiverId === userId && t.status === 'COMPLETED')
    .map((t) => ({ amount: Number(t.amount), date: t.createdAt }))
  const outItems = [
    ...recentTransfers
      .filter((t) => t.senderId === userId && t.status === 'COMPLETED')
      .map((t) => ({ amount: Number(t.amount), date: t.createdAt })),
    ...recentPayments
      .filter((p) => p.status === 'COMPLETED')
      .map((p) => ({ amount: Number(p.amount), date: p.createdAt })),
  ]
  const inSpark = buildSparkline(inItems)
  const outSpark = buildSparkline(outItems)

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
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const grouped = allTransactions.slice(0, 8).reduce<Record<string, typeof allTransactions>>(
    (acc, tx) => {
      const key = formatDayLabel(new Date(tx.date))
      acc[key] = acc[key] ?? []
      acc[key].push(tx)
      return acc
    },
    {},
  )

  return (
    <div className="space-y-5 animate-fade-in pb-6">
      {/* ── Hero: salutation éditoriale ─────────────────────────────────── */}
      <header className="flex items-end justify-between pt-2">
        <div>
          <p className="text-ink-muted text-xs font-semibold uppercase tracking-[0.18em]">
            {greeting}
          </p>
          <h1 className="mt-1 text-[28px] leading-[1.05] font-extrabold tracking-tight text-ink-primary">
            {firstName}
            <span className="inline-block ml-1.5 animate-pulse-brand">👋</span>
          </h1>
        </div>
        <Link
          href="/profile"
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-success-100 shadow-soft hover:border-success-500/40 transition"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
          </span>
          <span className="text-[11px] font-bold text-success-700">Vérifié</span>
        </Link>
      </header>

      {/* ── Bento row 1: Wallet hero ─────────────────────────────────────── */}
      <WalletCard
        balance={Number(wallet?.balance ?? 0)}
        ownerName={user.fullName}
        phone={user.phone}
        monthlyIn={monthlyIn}
        monthlyOut={monthlyOut}
      />

      {/* ── Bento row 2: Stats mensuelles avec sparklines ───────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Entrées */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-surface-200 p-4 shadow-soft hover:shadow-card transition">
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-success-500/5 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-success-50 flex items-center justify-center">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-success-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  Reçu ce mois
                </span>
              </div>
            </div>
            <p className="text-xl font-extrabold tracking-tight text-ink-primary tabular">
              {formatDZD(monthlyIn).replace(' DZD', '')}
              <span className="text-[10px] font-semibold text-ink-muted ml-1">DZD</span>
            </p>
            <div className="mt-2 text-success-500">
              <Sparkline points={inSpark} gradientId="spark-in" />
            </div>
          </div>
        </div>

        {/* Sorties */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-surface-200 p-4 shadow-soft hover:shadow-card transition">
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gold-500/5 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-gold-50 flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5 text-gold-600" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                  Dépensé ce mois
                </span>
              </div>
            </div>
            <p className="text-xl font-extrabold tracking-tight text-ink-primary tabular">
              {formatDZD(monthlyOut).replace(' DZD', '')}
              <span className="text-[10px] font-semibold text-ink-muted ml-1">DZD</span>
            </p>
            <div className="mt-2 text-gold-500">
              <Sparkline points={outSpark} gradientId="spark-out" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bento row 3: Quick actions (cartes éditoriales) ─────────────── */}
      <section>
        <div className="flex items-baseline justify-between mb-3 px-0.5">
          <h2 className="font-bold text-ink-primary text-[15px] tracking-tight">
            Actions rapides
          </h2>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            {quickActions.length} raccourcis
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, idx) => {
            const Icon = action.icon
            const s = accentStyles[action.accent]
            const isLarge = idx === 0
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`relative overflow-hidden group rounded-2xl bg-white border border-surface-200 p-4 transition-all duration-200 active:scale-[0.98] ${s.tile} ${
                  isLarge ? 'col-span-2' : ''
                }`}
              >
                <div
                  className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${s.glow} to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`}
                />
                <div className="relative flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    <Icon className={`w-5 h-5 ${s.iconFg}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-ink-primary text-[13px] leading-tight">
                      {action.label}
                    </p>
                    <p className="text-[11px] text-ink-muted mt-0.5 leading-tight truncate">
                      {action.hint}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-ink-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Bento row 4: Factures (chips scroll) + Promo (asymmetric) ──── */}
      <div className="grid grid-cols-5 gap-3">
        {/* Bill services — 3 cols */}
        <section className="col-span-5 md:col-span-3">
          <div className="flex items-baseline justify-between mb-3 px-0.5">
            <h2 className="font-bold text-ink-primary text-[15px] tracking-tight">Factures</h2>
            <Link
              href="/bills"
              className="text-[11px] text-brand-600 font-bold flex items-center gap-1 hover:gap-1.5 transition-all"
            >
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
            {billServices.map((service) => {
              const Icon = service.icon
              return (
                <Link key={service.label} href="/bills" className="operator-chip">
                  <div className={`w-10 h-10 rounded-xl ${service.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-ink-primary">{service.label}</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Promo card — bento 2 cols on desktop, full on mobile */}
        <Link
          href="/transfer"
          className="col-span-5 md:col-span-2 relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-card hover:shadow-card-hover transition-all group"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/3 translate-x-1/3" />
            <Sparkles className="absolute right-3 bottom-3 w-16 h-16" />
          </div>
          <div className="relative">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/25 backdrop-blur mb-2">
              <TrendingUp className="w-2.5 h-2.5" />
              <span className="text-[9px] font-extrabold uppercase tracking-wider">Offre</span>
            </div>
            <h3 className="font-extrabold text-lg leading-tight tracking-tight">
              0% de frais
            </h3>
            <p className="text-white/90 text-[11px] mt-1 leading-snug">
              Jusqu'à 100 000 DZD ce mois
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold bg-white/15 backdrop-blur px-2.5 py-1 rounded-full group-hover:bg-white/25 transition">
              Profiter <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>
      </div>

      {/* ── Bento row 5: Activité (groupée par jour) ────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-white border border-surface-200 shadow-soft">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-surface-100">
          <div>
            <h2 className="font-bold text-ink-primary text-[15px] tracking-tight">
              Dernière activité
            </h2>
            <p className="text-[10px] text-ink-muted font-medium mt-0.5">
              {allTransactions.length} opération{allTransactions.length > 1 ? 's' : ''} récente
              {allTransactions.length > 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/history"
            className="text-[11px] text-brand-600 font-bold flex items-center gap-1 hover:gap-1.5 transition-all"
          >
            Tout voir <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {allTransactions.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-surface-100 flex items-center justify-center">
              <History className="w-6 h-6 text-ink-muted" />
            </div>
            <p className="text-sm font-bold text-ink-primary mb-1">Aucune transaction</p>
            <p className="text-xs text-ink-secondary">
              Vos dernières opérations apparaîtront ici
            </p>
          </div>
        ) : (
          <div>
            {Object.entries(grouped).map(([day, txs]) => (
              <div key={day}>
                <div className="px-4 pt-3 pb-1 bg-gradient-to-b from-surface-50/50 to-transparent">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-ink-muted">
                    {day}
                  </p>
                </div>
                <div className="divide-y divide-surface-100 px-2 pb-1">
                  {txs.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      type={tx.type}
                      title={tx.title}
                      subtitle={tx.subtitle}
                      amount={tx.amount}
                      status={tx.status}
                      date={tx.date}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Signature discrète ──────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <ShieldCheck className="w-3.5 h-3.5 text-ink-muted" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
          Sécurisé · Banque d'Algérie
        </p>
      </div>
    </div>
  )
}
