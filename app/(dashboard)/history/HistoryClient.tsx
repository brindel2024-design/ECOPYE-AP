'use client'

import TransactionItem from '@/components/TransactionItem'
import { History, Search } from 'lucide-react'
import { useState } from 'react'

type TxType = 'sent' | 'received' | 'payment'

interface Transaction {
  id: string
  type: TxType
  title: string
  subtitle: string
  amount: number
  status: string
  date: string
  reference?: string
}

const filters = [
  { label: 'Tout', value: 'all' },
  { label: 'Envoyés', value: 'sent' },
  { label: 'Reçus', value: 'received' },
  { label: 'Paiements', value: 'payment' },
]

export default function HistoryClient({ transactions }: { transactions: Transaction[] }) {
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = transactions.filter((tx) => {
    const matchFilter = filter === 'all' || tx.type === filter
    const matchSearch =
      !search ||
      tx.title.toLowerCase().includes(search.toLowerCase()) ||
      tx.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  // Grouper par date
  const grouped = filtered.reduce((acc, tx) => {
    const date = new Date(tx.date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let label: string
    if (date.toDateString() === today.toDateString()) label = "Aujourd'hui"
    else if (date.toDateString() === yesterday.toDateString()) label = 'Hier'
    else label = date.toLocaleDateString('fr-DZ', { day: '2-digit', month: 'long', year: 'numeric' })

    if (!acc[label]) acc[label] = []
    acc[label].push(tx)
    return acc
  }, {} as Record<string, Transaction[]>)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* En-tête */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Historique</h1>
        <p className="text-sm text-gray-500">Toutes vos transactions</p>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une transaction..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
              ${filter === f.value
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Résultats */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-gray-500">Aucune transaction trouvée</p>
          <p className="text-sm mt-1">
            {search ? 'Essayez une autre recherche' : 'Vos transactions apparaîtront ici'}
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, txs]) => (
          <div key={date} className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">{date}</p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden px-2 py-1 divide-y divide-gray-50">
              {txs.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  type={tx.type}
                  title={tx.title}
                  subtitle={tx.subtitle}
                  amount={tx.amount}
                  status={tx.status}
                  date={tx.date}
                  reference={tx.reference}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
