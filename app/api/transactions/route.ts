import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const type = searchParams.get('type') // 'transfer' | 'payment' | null
    const skip = (page - 1) * limit

    const [transfers, payments] = await Promise.all([
      type !== 'payment'
        ? db.transfer.findMany({
            where: { OR: [{ senderId: userId }, { receiverId: userId }] },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
              sender: { select: { fullName: true, phone: true } },
              receiver: { select: { fullName: true, phone: true } },
            },
          })
        : [],
      type !== 'transfer'
        ? db.payment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
          })
        : [],
    ])

    const allTx = [
      ...transfers.map((t) => ({
        id: t.id,
        type: t.senderId === userId ? 'sent' : 'received',
        title: t.senderId === userId ? t.receiver.fullName : t.sender.fullName,
        subtitle: t.description,
        amount: Number(t.amount),
        fee: Number(t.fee),
        status: t.status,
        reference: t.reference,
        date: t.createdAt,
      })),
      ...payments.map((p) => ({
        id: p.id,
        type: 'payment',
        title: p.merchantName,
        subtitle: p.description,
        amount: Number(p.amount),
        fee: 0,
        status: p.status,
        reference: p.reference,
        date: p.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(skip, skip + limit)

    return NextResponse.json({ transactions: allTx, page, limit })
  } catch (error) {
    console.error('[TRANSACTIONS]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
