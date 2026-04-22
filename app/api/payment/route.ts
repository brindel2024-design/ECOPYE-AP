import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { merchantName, merchantId, amount, description, paymentMethod } = body

    if (!merchantName?.trim()) {
      return NextResponse.json({ error: 'Marchand invalide' }, { status: 400 })
    }
    if (!amount || isNaN(amount) || amount < 100) {
      return NextResponse.json({ error: 'Montant minimum: 100 DZD' }, { status: 400 })
    }

    // Vérifier le portefeuille
    const wallet = await db.wallet.findUnique({ where: { userId: session.user.id } })
    if (!wallet) {
      return NextResponse.json({ error: 'Portefeuille introuvable' }, { status: 404 })
    }
    if (wallet.isLocked) {
      return NextResponse.json({ error: 'Votre portefeuille est temporairement bloqué' }, { status: 403 })
    }
    if (wallet.balance < amount) {
      return NextResponse.json({
        error: `Solde insuffisant. Solde actuel: ${wallet.balance.toLocaleString()} DZD`,
      }, { status: 400 })
    }

    // Créer le paiement et débiter le solde
    const [payment] = await db.$transaction([
      db.payment.create({
        data: {
          userId: session.user.id,
          merchantName: merchantName.trim(),
          merchantId: merchantId || null,
          amount,
          description: description?.trim() || null,
          status: 'COMPLETED',
          paymentMethod: paymentMethod || 'WALLET',
        },
      }),
      db.wallet.update({
        where: { userId: session.user.id },
        data: { balance: { decrement: amount } },
      }),
    ])

    return NextResponse.json({
      message: 'Paiement effectué',
      reference: payment.reference,
      amount,
      merchantName,
    })
  } catch (error) {
    console.error('[PAYMENT]', error)
    return NextResponse.json({ error: 'Erreur lors du paiement' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const payments = await db.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('[PAYMENT_GET]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
