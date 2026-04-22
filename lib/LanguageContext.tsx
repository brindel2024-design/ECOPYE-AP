'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Locale, translations, TranslationKey } from './i18n'

interface LanguageContextType {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey) => string
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'fr',
  setLocale: () => {},
  t: (key) => key,
  isRTL: false,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')

  useEffect(() => {
    const saved = localStorage.getItem('ecopye-locale') as Locale | null
    if (saved === 'ar' || saved === 'fr') setLocaleState(saved)
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    localStorage.setItem('ecopye-locale', l)
    // Appliquer la direction RTL au document
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = l
  }

  useEffect(() => {
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = locale
  }, [locale])

  function t(key: TranslationKey): string {
    return translations[locale][key] ?? translations.fr[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, isRTL: locale === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
