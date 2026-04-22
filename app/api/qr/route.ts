import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'

// POST /api/qr — générer un QR Code de paiement
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  try {
    const { amount, label, isStatic = false } = await req.json()

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { fullName: true, phone: true },
    })

    const payload = JSON.stringify({
      t: 'ecopye',       // type
      mid: session.user.id,
      name: user?.fullName,
      phone: user?.phone,
      amount: amount ? Number(amount) : null,
      label: label || null,
      ref: uuidv4(),
      ts: Date.now(),
    })

    const expiresAt = isStatic ? null : new Date(Date.now() + 30 * 60 * 1000)

    const qrRecord = await db.qRCode.create({
      data: {
        userId: session.user.id,
        amount: amount ? Number(amount) : null,
        label: label || null,
        payload,
        isStatic,
        expiresAt,
      },
    })

    const qrImage = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      width: 320,
      color: { dark: '#006FD6', light: '#FFFFFF' },
    })

    return NextResponse.json({ id: qrRecord.id, qrImage, payload, expiresAt })
  } catch (err) {
    console.error('[QR POST]', err)
    return NextResponse.json({ error: 'Erreur génération QR' }, { status: 500 })
  }
}
