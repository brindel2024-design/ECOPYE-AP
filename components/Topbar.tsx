'use client'

import LanguageSwitcher from '@/components/LanguageSwitcher'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  Bell,
  CheckCheck,
  HandCoins,
  Menu,
  Receipt,
  Wallet,
  X,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  isRead: boolean
  createdAt: string
}

const NOTIF_ICONS: Record<string, React.ElementType> = {
  transfer_sent:     ArrowUpRight,
  transfer_received: Wallet,
  bill_paid:         Receipt,
  cagnotte:          HandCoins,
  system:            Bell,
}

const NOTIF_COLORS: Record<string, string> = {
  transfer_sent:     'bg-brand-50 text-brand-600',
  transfer_received: 'bg-green-50 text-green-600',
  bill_paid:         'bg-amber-50 text-amber-600',
  cagnotte:          'bg-purple-50 text-purple-600',
  system:            'bg-gray-100 text-gray-500',
}

interface TopbarProps {
  onMenuClick: () => void
  title?: string
}

export default function Topbar({ onMenuClick, title }: TopbarProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (data.notifications) {
        setNotifications(data.notifications)
        setUnread(data.unreadCount ?? 0)
      }
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifs()
    const id = setInterval(fetchNotifs, 30_000)
    return () => clearInterval(id)
  }, [fetchNotifs])

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' })
    setNotifications(n => n.map(x => ({ ...x, isRead: true })))
    setUnread(0)
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x))
    setUnread(u => Math.max(0, u - 1))
  }

  function timeAgo(date: string) {
    const diff = (Date.now() - new Date(date).getTime()) / 1000
    if (diff < 60) return 'à l\'instant'
    if (diff < 3600) return `${Math.floor(diff / 60)} min`
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`
    return `${Math.floor(diff / 86400)} j`
  }

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-lg border-b border-surface-200 px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-surface-100 text-ink-secondary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1">
          {title ? (
            <h1 className="text-base font-bold text-ink-primary tracking-tight">{title}</h1>
          ) : (
            <div className="bg-brand-900 rounded-xl px-3 py-1.5">
              <Image src="/logo.png" alt="EcoPye" width={90} height={28} priority className="object-contain" />
            </div>
          )}
        </div>

        <LanguageSwitcher />

        {/* Cloche notifications */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => { setOpen(o => !o); if (!open) fetchNotifs() }}
            className="p-2 rounded-xl hover:bg-surface-100 text-ink-secondary transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-brand-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50"
              >
                {/* En-tête */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-semibold">
                        <CheckCheck className="w-3.5 h-3.5" /> Tout lire
                      </button>
                    )}
                    <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Liste */}
                <div className="max-h-80 overflow-y-auto">
                  {loading && notifications.length === 0 ? (
                    <div className="p-4 space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-gray-100 rounded w-3/4" />
                            <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Aucune notification</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {notifications.map(n => {
                        const Icon = NOTIF_ICONS[n.type] ?? Bell
                        const color = NOTIF_COLORS[n.type] ?? NOTIF_COLORS.system
                        return (
                          <button
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors ${!n.isRead ? 'bg-brand-50/30' : ''}`}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                {n.title}
                              </p>
                              <p className="text-xs text-gray-400 truncate mt-0.5">{n.body}</p>
                              <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.createdAt)}</p>
                            </div>
                            {!n.isRead && (
                              <div className="w-2 h-2 rounded-full bg-brand-600 mt-1.5 flex-shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Pied */}
                {notifications.length > 0 && (
                  <div className="border-t border-gray-100 p-2">
                    <Link
                      href="/history"
                      onClick={() => setOpen(false)}
                      className="block w-full text-center text-xs text-brand-600 font-semibold py-2 rounded-xl hover:bg-brand-50"
                    >
                      Voir tout l'historique →
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <div className="w-9 h-9 bg-gradient-brand rounded-full flex items-center justify-center text-white font-bold text-xs shadow-card ring-2 ring-white">
          {session?.user?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  )
}
