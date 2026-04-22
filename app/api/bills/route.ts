import { authOptions } from '@/lib/auth'
import { PROVIDERS } from '@/lib/bill-providers'
import { db } from '@/lib/db'
import { createAuditLog, createNotification } from '@/lib/notifications'
import { formatDZD } from '@/lib/utils'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/bills — liste des fournisseurs
export async function GET() {
  return NextResponse.json(
    Object.entries(PROVIDERS).map(([id, info]) => ({ id, ...info }))
  )
}

// POST /api/bills — payer une facture
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const { provider, accountNumber, amount, pin } = await req.json()

    if (!PROVIDERS[provider]) return NextResponse.json({ error: 'Fournisseur inconnu' }, { status: 400 })
    if (!accountNumber?.trim()) return NextResponse.json({ error: 'Numéro de compte requis' }, { status: 400 })

    const parsedAmount = parseFloat(amount)
    const providerInfo = PROVIDERS[provider]

    if (isNaN(parsedAmount) || parsedAmount < providerInfo.min || parsedAmount > providerInfo.max) {
      return NextResponse.json(
        { error: `Montant entre ${providerInfo.min} et ${providerInfo.max} DZD` },
        { status: 400 }
      )
    }

    // Vérification PIN
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { wallet: true },
    })
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    if (user.pin) {
      if (!pin) return NextResponse.json({ error: 'PIN requis' }, { status: 400 })
      const pinOk = await bcrypt.compare(pin, user.pin)
      if (!pinOk) return NextResponse.json({ error: 'PIN incorrect' }, { status: 401 })
    }

    if (!user.wallet || user.wallet.balance < parsedAmount) {
      return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 })
    }
    if (user.wallet.isLocked) {
      return NextResponse.json({ error: 'Votre portefeuille est verrouillé' }, { status: 403 })
    }

    // Transaction atomique
    const [bill] = await db.$transaction([
      db.billPayment.create({
        data: {
          userId: session.user.id,
          provider,
          accountNumber: accountNumber.trim(),
          amount: parsedAmount,
          status: 'COMPLETED',
        },
      }),
      db.wallet.update({
        where: { userId: session.user.id },
        data: { balance: { decrement: parsedAmount } },
      }),
    ])

    // Notification + audit
    Promise.all([
      createNotification({
        userId: session.user.id,
        title: `Facture ${providerInfo.name} payée`,
        body: `${formatDZD(parsedAmount)} débités — N° ${accountNumber.trim()}`,
        type: 'bill_paid',
        data: { billId: bill.id, provider, amount: parsedAmount },
      }),
      createAuditLog({ userId: session.user.id, action: 'bill_payment', resource: 'BillPayment', resourceId: bill.id, metadata: { provider, amount: parsedAmount } }),
    ]).catch(() => null)

    return NextResponse.json({
      message: `Paiement ${providerInfo.name} réussi`,
      receipt: {
        id: bill.id,
        reference: bill.reference,
        provider: providerInfo.name,
        accountNumber: accountNumber.trim(),
        amount: parsedAmount,
        paidAt: bill.paidAt,
      },
    })
  } catch (err) {
    console.error('[BILLS POST]', err)
    return NextResponse.json({ error: 'Erreur paiement facture' }, { status: 500 })
  }
}
