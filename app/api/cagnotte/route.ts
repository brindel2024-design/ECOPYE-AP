import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateShareCode } from '@/lib/crypto'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/cagnotte — mes cagnottes + découverte publique
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') || 'mine'
  const type = searchParams.get('type') || undefined
  const search = searchParams.get('q') || undefined

  if (view === 'public') {
    const items = await db.cagnotte.findMany({
      where: {
        isPublic: true,
        isActive: true,
        ...(type && { type }),
        ...(search && { title: { contains: search } }),
      },
      include: {
        creator: { select: { fullName: true } },
        _count: { select: { contributions: true } },
      },
      orderBy: { currentAmount: 'desc' },
      take: 30,
    })
    return NextResponse.json(items)
  }

  const items = await db.cagnotte.findMany({
    where: { creatorId: session.user.id },
    include: { _count: { select: { contributions: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(items)
}

// POST /api/cagnotte — créer une cagnotte
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const { title, description, type, targetAmount, isPublic, deadline } = await req.json()

    if (!title?.trim() || title.trim().length < 3) {
      return NextResponse.json({ error: 'Titre requis (min 3 caractères)' }, { status: 400 })
    }
    if (!['charity', 'family', 'event'].includes(type)) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    }

    // Génération d'un code de partage unique
    let shareCode = generateShareCode()
    while (await db.cagnotte.findUnique({ where: { shareCode } })) {
      shareCode = generateShareCode()
    }

    const cagnotte = await db.cagnotte.create({
      data: {
        creatorId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        type,
        targetAmount: targetAmount ? parseFloat(targetAmount) : null,
        isPublic: Boolean(isPublic ?? true),
        shareCode,
        deadline: deadline ? new Date(deadline) : null,
      },
      include: {
        creator: { select: { fullName: true } },
        _count: { select: { contributions: true } },
      },
    })

    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/cagnotte/${cagnotte.shareCode}`

    return NextResponse.json({ cagnotte, shareUrl }, { status: 201 })
  } catch (err) {
    console.error('[CAGNOTTE POST]', err)
    return NextResponse.json({ error: 'Erreur création cagnotte' }, { status: 500 })
  }
}
