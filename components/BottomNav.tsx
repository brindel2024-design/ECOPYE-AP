'use client'

import { useLanguage } from '@/lib/LanguageContext'
import { cn } from '@/lib/utils'
import { HandCoins, Home, QrCode, Send, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const navItems = [
    { href: '/dashboard', icon: Home,       label: t('home')      },
    { href: '/transfer',  icon: Send,       label: t('transfer')  },
    { href: '/pay',       icon: QrCode,     label: t('pay')       },
    { href: '/cagnotte',  icon: HandCoins,  label: t('cagnotte')  },
    { href: '/profile',   icon: User,       label: t('profile')   },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-surface-200 lg:hidden safe-area-pb">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          const isPay = item.href === '/pay'

          if (isPay) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-6">
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center shadow-wallet ring-4 ring-white',
                  active ? 'bg-brand-700' : 'bg-gradient-brand'
                )}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={2.2} />
                </div>
                <span className={cn(
                  'text-[10px] mt-1 font-bold tracking-tight',
                  active ? 'text-brand-700' : 'text-brand-600'
                )}>
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors"
            >
              <Icon
                className={cn(
                  'w-5 h-5 transition-colors',
                  active ? 'text-brand-600' : 'text-ink-muted'
                )}
                strokeWidth={active ? 2.4 : 1.8}
              />
              <span className={cn(
                'text-[10px] font-semibold tracking-tight transition-colors',
                active ? 'text-brand-600' : 'text-ink-muted'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
