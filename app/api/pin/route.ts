import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// Créer / mettre à jour le PIN
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { pin } = await req.json()

    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'Le PIN doit être composé de 4 chiffres' }, { status: 400 })
    }

    const pinHash = await bcrypt.hash(pin, 12)

    await db.user.update({
      where: { id: session.user.id },
      data: { pin: pinHash },
    })

    return NextResponse.json({ message: 'PIN créé avec succès' })
  } catch (error) {
    console.error('[PIN_SET]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Vérifier le PIN avant une transaction
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { pin } = await req.json()

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { pin: true },
    })

    if (!user?.pin) {
      return NextResponse.json({ error: 'Aucun PIN configuré', code: 'NO_PIN' }, { status: 400 })
    }

    const isValid = await bcrypt.compare(pin, user.pin)
    if (!isValid) {
      return NextResponse.json({ error: 'PIN incorrect', code: 'WRONG_PIN' }, { status: 401 })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('[PIN_VERIFY]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
