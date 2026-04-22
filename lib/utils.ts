import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formater un montant en DZD */
export function formatDZD(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Formater un numéro de téléphone algérien */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('213')) {
    const local = cleaned.slice(3)
    return `+213 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7)}`
  }
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

/** Valider un numéro de téléphone algérien */
export function isValidAlgerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  // Formats: +213XXXXXXXXX, 0XXXXXXXXX
  return /^(\+213|00213|0)(5|6|7)\d{8}$/.test(cleaned)
}

/** Normaliser un numéro de téléphone au format +213 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('0')) {
    return '+213' + cleaned.slice(1)
  }
  if (cleaned.startsWith('00213')) {
    return '+' + cleaned.slice(2)
  }
  return cleaned
}

/** Générer une référence de transaction */
export function generateRef(prefix = 'TXN'): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

/** Calculer les frais de transfert */
export function calculateFee(amount: number): number {
  // 0.5% avec minimum 25 DZD et maximum 500 DZD
  const fee = amount * 0.005
  return Math.min(Math.max(fee, 25), 500)
}

/** Masquer partiellement un numéro de téléphone */
export function maskPhone(phone: string): string {
  if (phone.length < 8) return phone
  return phone.slice(0, -6) + '***' + phone.slice(-3)
}

/** Obtenir le label d'un opérateur mobile algérien */
export function getMobileOperator(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const prefix = cleaned.startsWith('213') ? cleaned.slice(3, 5) : cleaned.slice(1, 3)

  const operators: Record<string, string> = {
    '05': 'Ooredoo', '55': 'Ooredoo',
    '06': 'Mobilis', '66': 'Mobilis',
    '07': 'Djezzy', '77': 'Djezzy',
  }

  return operators[prefix] || 'Inconnu'
}

/** Formater une date relative */
export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`

  return d.toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Couleur selon le statut d'une transaction */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    COMPLETED: 'text-green-600 bg-green-50',
    PENDING: 'text-amber-600 bg-amber-50',
    FAILED: 'text-red-600 bg-red-50',
    CANCELLED: 'text-gray-500 bg-gray-50',
    REFUNDED: 'text-blue-600 bg-blue-50',
  }
  return colors[status] || 'text-gray-500 bg-gray-50'
}

/** Label français d'un statut */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    COMPLETED: 'Effectué',
    PENDING: 'En cours',
    FAILED: 'Échoué',
    CANCELLED: 'Annulé',
    REFUNDED: 'Remboursé',
  }
  return labels[status] || status
}
