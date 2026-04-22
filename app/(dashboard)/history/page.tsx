import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import HistoryClient from './HistoryClient'

export default async function HistoryPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const [transfers, payments] = await Promise.all([
    db.transfer.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: { select: { fullName: true, phone: true } },
        receiver: { select: { fullName: true, phone: true } },
      },
    }),
    db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  const allTx = [
    ...transfers.map((t) => ({
      id: t.id,
      type: (t.senderId === userId ? 'sent' : 'received') as 'sent' | 'received',
      title: t.senderId === userId ? t.receiver.fullName : t.sender.fullName,
      subtitle: t.description || '',
      amount: Number(t.amount),
      status: t.status,
      date: t.createdAt.toISOString(),
      reference: t.reference,
    })),
    ...payments.map((p) => ({
      id: p.id,
      type: 'payment' as const,
      title: p.merchantName,
      subtitle: p.description || '',
      amount: Number(p.amount),
      status: p.status,
      date: p.createdAt.toISOString(),
      reference: p.reference,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return <HistoryClient transactions={allTx} />
}
