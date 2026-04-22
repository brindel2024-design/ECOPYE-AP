import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatDZD } from '@/lib/utils'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

async function getDashboardData(userId: string) {
  const [wallet, recentTransfers, recentPayments] = await Promise.all([
    db.wallet.findUnique({ where: { userId } }),
    db.transfer.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        sender: { select: { fullName: true, phone: true } },
        receiver: { select: { fullName: true, phone: true } },
      },
    }),
    db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ])

  // Calcul stats mensuelles
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const monthlyTransfersIn = await db.transfer.aggregate({
    where: {
      receiverId: userId,
      status: 'COMPLETED',
      createdAt: { gte: startOfMonth },
    },
    _sum: { amount: true },
  })

  const monthlyTransfersOut = await db.transfer.aggregate({
    where: {
      senderId: userId,
      status: 'COMPLETED',
      createdAt: { gte: startOfMonth },
    },
    _sum: { amount: true },
  })

  const monthlyPayments = await db.payment.aggregate({
    where: {
      userId,
      status: 'COMPLETED',
      createdAt: { gte: startOfMonth },
    },
    _sum: { amount: true },
  })

  return {
    wallet: wallet ? { balance: Number(wallet.balance) } : null,
    recentTransfers: recentTransfers.map((t) => ({
      ...t,
      amount: Number(t.amount),
      fee: Number(t.fee),
    })),
    recentPayments: recentPayments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    })),
    monthlyIn: Number(monthlyTransfersIn._sum.amount || 0),
    monthlyOut: Number(monthlyTransfersOut._sum.amount || 0) + Number(monthlyPayments._sum.amount || 0),
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { fullName: true, phone: true },
  })

  if (!user) redirect('/login')

  const data = await getDashboardData(session.user.id)

  return (
    <DashboardClient
      user={user}
      wallet={data.wallet}
      recentTransfers={data.recentTransfers}
      recentPayments={data.recentPayments}
      monthlyIn={data.monthlyIn}
      monthlyOut={data.monthlyOut}
      userId={session.user.id}
    />
  )
}
