import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { decryptFaceDescriptor, encryptFaceDescriptor, faceDistance } from '@/lib/crypto'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

const ENROLL_FRAMES = 128

// POST /api/auth/face — enregistrer le descripteur facial
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { descriptor } = await req.json()

    if (!Array.isArray(descriptor) || descriptor.length !== ENROLL_FRAMES) {
      return NextResponse.json(
        { error: `Descripteur facial invalide (attendu ${ENROLL_FRAMES} valeurs)` },
        { status: 400 }
      )
    }

    // Vérifier que toutes les valeurs sont des nombres
    if (descriptor.some((v: unknown) => typeof v !== 'number')) {
      return NextResponse.json({ error: 'Descripteur corrompu' }, { status: 400 })
    }

    const encrypted = encryptFaceDescriptor(descriptor)

    await db.user.update({
      where: { id: session.user.id },
      data: {
        faceDescriptor: encrypted,
        faceEnrolledAt: new Date(),
        isVerified: true,
      },
    })

    return NextResponse.json({ enrolled: true, message: 'Reconnaissance faciale activée' })
  } catch (err) {
    console.error('[FACE POST]', err)
    return NextResponse.json({ error: 'Erreur enregistrement facial' }, { status: 500 })
  }
}

// PUT /api/auth/face — vérifier l'identité faciale
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { descriptor } = await req.json()

    if (!Array.isArray(descriptor) || descriptor.length !== ENROLL_FRAMES) {
      return NextResponse.json({ error: 'Descripteur invalide' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { faceDescriptor: true },
    })

    if (!user?.faceDescriptor) {
      return NextResponse.json({ error: 'Aucun visage enregistré. Configurez d\'abord la biométrie.' }, { status: 400 })
    }

    const stored  = decryptFaceDescriptor(user.faceDescriptor)
    const dist    = faceDistance(stored, descriptor)
    const THRESHOLD = 0.5

    if (dist > THRESHOLD) {
      return NextResponse.json(
        { verified: false, error: 'Visage non reconnu', distance: dist },
        { status: 401 }
      )
    }

    const confidence = Math.round(Math.max(0, (1 - dist / THRESHOLD)) * 100)
    return NextResponse.json({ verified: true, confidence })
  } catch (err) {
    console.error('[FACE PUT]', err)
    return NextResponse.json({ error: 'Erreur vérification faciale' }, { status: 500 })
  }
}

// DELETE /api/auth/face — supprimer les données faciales
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { faceDescriptor: null, faceEnrolledAt: null },
  })

  return NextResponse.json({ message: 'Données faciales supprimées' })
}
