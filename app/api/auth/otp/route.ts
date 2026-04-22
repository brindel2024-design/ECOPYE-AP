import { db } from '@/lib/db'
import { generateOTP } from '@/lib/crypto'
import { sendOTP } from '@/lib/sms'
import { isValidAlgerianPhone, normalizePhone } from '@/lib/utils'
import { NextRequest, NextResponse } from 'next/server'

const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes
const RATE_WINDOW = 60 * 1000       // 1 minute
const RATE_MAX = 3

// POST /api/auth/otp — envoyer un OTP
export async function POST(req: NextRequest) {
  try {
    const { phone, purpose = 'register' } = await req.json()

    if (!isValidAlgerianPhone(phone)) {
      return NextResponse.json({ error: 'Numéro algérien invalide' }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)

    // Anti-spam : max 3 envois par minute
    const recent = await db.oTPCode.count({
      where: {
        phone: normalizedPhone,
        purpose,
        createdAt: { gte: new Date(Date.now() - RATE_WINDOW) },
      },
    })
    if (recent >= RATE_MAX) {
      return NextResponse.json({ error: 'Trop de demandes. Attendez 1 minute.' }, { status: 429 })
    }

    // Invalider les anciens codes
    await db.oTPCode.updateMany({
      where: { phone: normalizedPhone, purpose, isUsed: false },
      data: { isUsed: true },
    })

    const code = generateOTP()
    await db.oTPCode.create({
      data: {
        phone: normalizedPhone,
        code,
        purpose,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    })

    await sendOTP(normalizedPhone, code, purpose)

    return NextResponse.json({ message: 'Code envoyé', expiresIn: OTP_TTL_MS / 1000 })
  } catch (err) {
    console.error('[OTP POST]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT /api/auth/otp — vérifier un OTP
export async function PUT(req: NextRequest) {
  try {
    const { phone, code, purpose = 'register' } = await req.json()

    const normalizedPhone = normalizePhone(phone)

    const otp = await db.oTPCode.findFirst({
      where: {
        phone: normalizedPhone,
        code,
        purpose,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      return NextResponse.json({ error: 'Code invalide ou expiré' }, { status: 400 })
    }

    await db.oTPCode.update({ where: { id: otp.id }, data: { isUsed: true } })

    return NextResponse.json({ verified: true })
  } catch (err) {
    console.error('[OTP PUT]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
