'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Une erreur s'est produite</h2>
      <p className="text-gray-500 text-sm mb-6">{error.message || 'Veuillez réessayer.'}</p>
      <Button onClick={reset} leftIcon={<RefreshCw className="w-4 h-4" />}>
        Réessayer
      </Button>
    </div>
  )
}
