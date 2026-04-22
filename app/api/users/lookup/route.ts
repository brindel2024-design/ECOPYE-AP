import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { isValidAlgerianPhone, normalizePhone } from '@/lib/utils'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')

    if (!phone || !isValidAlgerianPhone(phone)) {
      return NextResponse.json({ error: 'Numéro invalide' }, { status: 400 })
    }

    const normalized = normalizePhone(phone)

    // Ne pas se retrouver soi-même
    const currentUser = await db.user.findUnique({ where: { id: session.user.id } })
    if (currentUser?.phone === normalized) {
      return NextResponse.json({ error: 'Vous ne pouvez pas vous envoyer de l\'argent' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { phone: normalized, isActive: true },
      select: { fullName: true, phone: true, isVerified: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Aucun compte ECOPYE avec ce numéro' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('[USER_LOOKUP]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
