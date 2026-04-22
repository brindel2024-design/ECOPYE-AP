import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const wallet = await db.wallet.findUnique({
      where: { userId: session.user.id },
    })

    if (!wallet) {
      return NextResponse.json({ error: 'Portefeuille introuvable' }, { status: 404 })
    }

    return NextResponse.json({
      balance: Number(wallet.balance),
      currency: wallet.currency,
      isLocked: wallet.isLocked,
    })
  } catch (error) {
    console.error('[WALLET_GET]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Recharge du portefeuille (simulation - en prod ce serait via CIB/BaridiMob)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { amount, method } = body

    if (!amount || isNaN(amount) || amount < 500) {
      return NextResponse.json({ error: 'Montant minimum de recharge: 500 DZD' }, { status: 400 })
    }
    if (amount > 500_000) {
      return NextResponse.json({ error: 'Montant maximum de recharge: 500 000 DZD' }, { status: 400 })
    }

    const wallet = await db.wallet.update({
      where: { userId: session.user.id },
      data: { balance: { increment: amount } },
    })

    return NextResponse.json({
      message: 'Recharge effectuée',
      newBalance: Number(wallet.balance),
      amount,
    })
  } catch (error) {
    console.error('[WALLET_TOPUP]', error)
    return NextResponse.json({ error: 'Erreur lors de la recharge' }, { status: 500 })
  }
}
