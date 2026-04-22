import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const bills = await db.billPayment.findMany({
    where: { userId: session.user.id },
    orderBy: { paidAt: 'desc' },
    take: 20,
  })

  return NextResponse.json(bills)
}
