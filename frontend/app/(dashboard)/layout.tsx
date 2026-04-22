import BottomNav from '@/components/layout/BottomNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface">
      <main className="pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
