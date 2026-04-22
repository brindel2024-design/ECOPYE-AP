import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

// POST /api/auth/totp — générer le secret TOTP
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true, totpEnabled: true },
    })
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    if (user.totpEnabled) return NextResponse.json({ error: '2FA déjà activé' }, { status: 400 })

    const secret = speakeasy.generateSecret({
      name: `EcoPye (${user.phone})`,
      issuer: 'EcoPye Pay',
      length: 20,
    })

    // Stocker temporairement le secret (pas encore activé)
    await db.user.update({
      where: { id: session.user.id },
      data: { totpSecret: secret.base32 },
    })

    const qrDataURL = await QRCode.toDataURL(secret.otpauth_url!, {
      width: 280,
      color: { dark: '#006FD6', light: '#FFFFFF' },
    })

    return NextResponse.json({
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrImage: qrDataURL,
    })
  } catch (err) {
    console.error('[TOTP POST]', err)
    return NextResponse.json({ error: 'Erreur génération TOTP' }, { status: 500 })
  }
}

// PUT /api/auth/totp — confirmer et activer le TOTP
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const { token } = await req.json()

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { totpSecret: true, totpEnabled: true },
    })
    if (!user?.totpSecret) return NextResponse.json({ error: 'Générez d\'abord le QR code' }, { status: 400 })

    const valid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token,
      window: 2,
    })

    if (!valid) return NextResponse.json({ error: 'Code invalide' }, { status: 400 })

    await db.user.update({
      where: { id: session.user.id },
      data: { totpEnabled: true },
    })

    return NextResponse.json({ activated: true, message: 'Authentification à deux facteurs activée' })
  } catch (err) {
    console.error('[TOTP PUT]', err)
    return NextResponse.json({ error: 'Erreur activation TOTP' }, { status: 500 })
  }
}

// DELETE /api/auth/totp — désactiver le TOTP
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  await db.user.update({
    where: { id: session.user.id },
    data: { totpSecret: null, totpEnabled: false },
  })

  return NextResponse.json({ message: '2FA désactivé' })
}
