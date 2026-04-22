import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/cagnotte/[shareCode] — détail d'une cagnotte
export async function GET(
  req: NextRequest,
  { params }: { params: { shareCode: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const cagnotte = await db.cagnotte.findUnique({
    where: { shareCode: params.shareCode },
    include: {
      creator: { select: { fullName: true } },
      contributions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { user: { select: { fullName: true, avatar: true } } },
      },
      _count: { select: { contributions: true } },
    },
  })

  if (!cagnotte) return NextResponse.json({ error: 'Cagnotte introuvable' }, { status: 404 })
  if (!cagnotte.isPublic && cagnotte.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Cagnotte privée' }, { status: 403 })
  }

  const progress = cagnotte.targetAmount
    ? Math.min(100, (cagnotte.currentAmount / cagnotte.targetAmount) * 100)
    : null

  return NextResponse.json({ ...cagnotte, progress })
}

// POST /api/cagnotte/[shareCode] — contribuer
export async function POST(
  req: NextRequest,
  { params }: { params: { shareCode: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const { amount, pin, message, isAnonymous = false } = await req.json()

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount < 100) {
      return NextResponse.json({ error: 'Montant minimum 100 DZD' }, { status: 400 })
    }

    const cagnotte = await db.cagnotte.findUnique({ where: { shareCode: params.shareCode } })
    if (!cagnotte || !cagnotte.isActive) {
      return NextResponse.json({ error: 'Cagnotte introuvable ou inactive' }, { status: 404 })
    }
    if (cagnotte.deadline && cagnotte.deadline < new Date()) {
      return NextResponse.json({ error: 'Cagnotte expirée' }, { status: 400 })
    }

    // Vérification PIN
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { wallet: true },
    })
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    if (user.pin) {
      if (!pin) return NextResponse.json({ error: 'PIN requis' }, { status: 400 })
      const ok = await bcrypt.compare(pin, user.pin)
      if (!ok) return NextResponse.json({ error: 'PIN incorrect' }, { status: 401 })
    }

    if (!user.wallet || user.wallet.balance < parsedAmount) {
      return NextResponse.json({ error: 'Solde insuffisant' }, { status: 400 })
    }

    // Transaction atomique
    const [contribution] = await db.$transaction([
      db.cagnotteContribution.create({
        data: {
          cagnotteId: cagnotte.id,
          userId: session.user.id,
          amount: parsedAmount,
          message: message?.trim() || null,
          isAnonymous: Boolean(isAnonymous),
        },
      }),
      db.cagnotte.update({
        where: { id: cagnotte.id },
        data: { currentAmount: { increment: parsedAmount } },
      }),
      db.wallet.update({
        where: { userId: session.user.id },
        data: { balance: { decrement: parsedAmount } },
      }),
      db.wallet.update({
        where: { userId: cagnotte.creatorId },
        data: { balance: { increment: parsedAmount } },
      }),
    ])

    return NextResponse.json({
      message: `Contribution de ${parsedAmount} DZD enregistrée. Merci !`,
      contributionId: contribution.id,
    })
  } catch (err) {
    console.error('[CAGNOTTE CONTRIB]', err)
    return NextResponse.json({ error: 'Erreur contribution' }, { status: 500 })
  }
}

// PATCH /api/cagnotte/[shareCode] — clôturer
export async function PATCH(
  req: NextRequest,
  { params }: { params: { shareCode: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const cagnotte = await db.cagnotte.findUnique({ where: { shareCode: params.shareCode } })
  if (!cagnotte || cagnotte.creatorId !== session.user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await db.cagnotte.update({ where: { id: cagnotte.id }, data: { isActive: false } })
  return NextResponse.json({ message: 'Cagnotte clôturée' })
}
