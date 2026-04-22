import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="text-8xl font-black text-brand-100 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page introuvable</h1>
      <p className="text-gray-500 mb-8">Cette page n'existe pas ou a été déplacée.</p>
      <Link href="/dashboard">
        <Button leftIcon={<Home className="w-4 h-4" />}>
          Retour à l'accueil
        </Button>
      </Link>
    </div>
  )
}
