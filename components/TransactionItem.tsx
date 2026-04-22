import { formatDZD, formatRelativeDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { ArrowDownLeft, ArrowUpRight, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

type TransactionType = 'sent' | 'received' | 'payment'

interface TransactionItemProps {
  type: TransactionType
  title: string
  subtitle?: string
  amount: number
  status: string
  date: Date | string
  reference?: string
  onClick?: () => void
}

export default function TransactionItem({
  type,
  title,
  subtitle,
  amount,
  status,
  date,
  reference,
  onClick,
}: TransactionItemProps) {
  const icons = {
    sent: <ArrowUpRight className="w-5 h-5 text-red-500" />,
    received: <ArrowDownLeft className="w-5 h-5 text-green-600" />,
    payment: <ShoppingBag className="w-5 h-5 text-blue-500" />,
  }

  const amountColors = {
    sent: 'text-red-600',
    received: 'text-green-600',
    payment: 'text-blue-600',
  }

  const bgColors = {
    sent: 'bg-red-50',
    received: 'bg-green-50',
    payment: 'bg-blue-50',
  }

  const prefix = {
    sent: '-',
    received: '+',
    payment: '-',
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-150',
        'hover:bg-gray-50 active:bg-gray-100',
        onClick && 'cursor-pointer'
      )}
    >
      {/* Icône */}
      <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0', bgColors[type])}>
        {icons[type]}
      </div>

      {/* Info */}
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 truncate">{subtitle}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{formatRelativeDate(date)}</p>
      </div>

      {/* Montant & statut */}
      <div className="text-right flex-shrink-0">
        <p className={cn('text-sm font-bold', amountColors[type])}>
          {prefix[type]}{formatDZD(amount)}
        </p>
        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', getStatusColor(status))}>
          {getStatusLabel(status)}
        </span>
      </div>
    </button>
  )
}
