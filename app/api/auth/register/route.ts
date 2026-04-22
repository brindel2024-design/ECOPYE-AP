import { db } from '@/lib/db'
import { isValidAlgerianPhone, normalizePhone } from '@/lib/utils'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fullName, phone, email, password } = body

    // Validation
    if (!fullName?.trim() || fullName.trim().length < 3) {
      return NextResponse.json({ error: 'Nom complet invalide (minimum 3 caractères)' }, { status: 400 })
    }
    if (!isValidAlgerianPhone(phone)) {
      return NextResponse.json({ error: 'Numéro de téléphone algérien invalide' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Mot de passe minimum 8 caractères' }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)

    // Vérifier si le numéro existe déjà
    const existing = await db.user.findUnique({ where: { phone: normalizedPhone } })
    if (existing) {
      return NextResponse.json({ error: 'Ce numéro de téléphone est déjà utilisé' }, { status: 409 })
    }

    // Vérifier email si fourni
    if (email) {
      const existingEmail = await db.user.findUnique({ where: { email } })
      if (existingEmail) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        fullName: fullName.trim(),
        phone: normalizedPhone,
        email: email?.trim() || null,
        passwordHash,
        isVerified: false,
        wallet: {
          create: {
            balance: 0,
            currency: 'DZD',
          },
        },
      },
      select: { id: true, fullName: true, phone: true },
    })

    return NextResponse.json(
      { message: 'Compte créé avec succès', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('[REGISTER]', error)
    return NextResponse.json({ error: 'Erreur serveur. Veuillez réessayer.' }, { status: 500 })
  }
}
