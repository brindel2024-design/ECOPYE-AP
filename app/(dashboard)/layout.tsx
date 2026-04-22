'use client'

import BottomNav from '@/components/BottomNav'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Sidebar desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar mobile */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <div className="max-w-2xl mx-auto px-4 py-4 lg:py-6">
            {children}
          </div>
        </main>

        {/* Navigation mobile */}
        <BottomNav />
      </div>
    </div>
  )
}
