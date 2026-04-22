'use client'

import { useLanguage } from '@/lib/LanguageContext'
import { cn } from '@/lib/utils'

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLanguage()

  return (
    <div className={cn('flex items-center bg-gray-100 rounded-xl p-1 gap-1', className)}>
      <button
        onClick={() => setLocale('fr')}
        className={cn(
          'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
          locale === 'fr'
            ? 'bg-white text-brand-700 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        FR
      </button>
      <button
        onClick={() => setLocale('ar')}
        className={cn(
          'px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 font-arabic',
          locale === 'ar'
            ? 'bg-white text-brand-700 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        عر
      </button>
    </div>
  )
}
