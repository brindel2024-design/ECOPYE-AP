'use client'

import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguage } from '@/lib/LanguageContext'
import { cn } from '@/lib/utils'
import {
  HandCoins,
  History,
  Home,
  LogOut,
  QrCode,
  Receipt,
  Send,
  Settings,
  User,
  Wallet,
  X,
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { t, isRTL } = useLanguage()

  const navItems = [
    { href: '/dashboard', icon: Home,      label: t('home')     },
    { href: '/transfer',  icon: Send,      label: t('transfer') },
    { href: '/pay',       icon: QrCode,    label: t('pay')      },
    { href: '/bills',     icon: Receipt,   label: 'Factures'    },
    { href: '/cagnotte',  icon: HandCoins, label: t('cagnotte') },
    { href: '/history',   icon: History,   label: t('history')  },
    { href: '/profile',   icon: User,      label: t('profile')  },
  ]

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed top-0 h-full w-64 bg-white shadow-xl z-50',
        'flex flex-col transition-transform duration-300 ease-in-out',
        isRTL
          ? 'right-0 border-l border-gray-100'
          : 'left-0 border-r border-gray-100',
        'lg:translate-x-0 lg:shadow-none',
        open
          ? 'translate-x-0'
          : isRTL ? 'translate-x-full' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl">
              <span className="text-gray-900">ECO</span>
              <span className="text-brand-500">PYE</span>
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profil */}
        <div className="p-4 mx-3 mt-3 bg-brand-50 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-brand rounded-full flex items-center justify-center text-white font-bold text-sm">
              {session?.user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {session?.user?.name || 'Utilisateur'}
              </p>
              <p className="text-xs text-brand-600">
                {(session?.user as any)?.phone || ''}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  active ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-600 hover:bg-brand-50 hover:text-brand-700'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
              </Link>
            )
          })}
        </nav>

        {/* Bas */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <div className="px-3 pb-2">
            <LanguageSwitcher className="w-full justify-center" />
          </div>
          <Link href="/settings" onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Settings className="w-5 h-5" />
            {t('settings')}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t('logout')}
          </button>
        </div>
      </aside>
    </>
  )
}
