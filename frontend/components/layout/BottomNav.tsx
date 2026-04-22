'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeftRight, QrCode, Receipt, Heart } from 'lucide-react'

const navItems = [
  { href: '/home',     icon: Home,            label: 'Accueil'   },
  { href: '/transfer', icon: ArrowLeftRight,  label: 'Transfert' },
  { href: '/qr',       icon: QrCode,          label: 'QR Code'   },
  { href: '/bills',    icon: Receipt,         label: 'Factures'  },
  { href: '/cagnotte', icon: Heart,           label: 'Cagnotte'  },
]

export default function BottomNav() {
  const path = usePathname()

  return (
    <nav className="bottom-nav z-50">
      {navItems.map(({ href, icon: Icon, label }) => {
        const active = path.startsWith(href)
        return (
          <Link key={href} href={href} className="flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center tap-feedback">
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-brand-500/20' : ''}`}>
              <Icon
                size={22}
                className={`transition-colors duration-200 ${active ? 'text-brand-400' : 'text-gray-500'}`}
                strokeWidth={active ? 2.5 : 1.5}
              />
            </div>
            <span className={`text-[10px] font-medium transition-colors ${active ? 'text-brand-400' : 'text-gray-600'}`}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
