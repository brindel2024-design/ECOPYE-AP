'use client'

import { LanguageProvider } from '@/lib/LanguageContext'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
            },
            success: { iconTheme: { primary: '#006233', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#dc2626', secondary: '#fff'  } },
          }}
        />
      </LanguageProvider>
    </SessionProvider>
  )
}
