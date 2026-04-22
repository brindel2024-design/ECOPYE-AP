import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createAuditLog, createNotification } from '@/lib/notifications'
import { calculateFee, formatDZD, isValidAlgerianPhone, normalizePhone } from '@/lib/utils'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { recipientPhone, amount, description } = body

    // Validations
    if (!recipientPhone || !isValidAlgerianPhone(recipientPhone)) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide' }, { status: 400 })
    }
    if (!amount || isNaN(amount) || amount < 100) {
      return NextResponse.json({ error: 'Montant minimum: 100 DZD' }, { status: 400 })
    }
    if (amount > 1_000_000) {
      return NextResponse.json({ error: 'Montant maximum: 1 000 000 DZD' }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(recipientPhone)
    const senderId = session.user.id

    // Vérifier que l'envoyeur n'envoie pas à lui-même
    const sender = await db.user.findUnique({
      where: { id: senderId },
      include: { wallet: true },
    })
    if (!sender) {
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 })
    }
    if (sender.phone === normalizedPhone) {
      return NextResponse.json({ error: 'Vous ne pouvez pas vous envoyer de l\'argent' }, { status: 400 })
    }

    // Trouver le destinataire
    const receiver = await db.user.findUnique({
      where: { phone: normalizedPhone },
      include: { wallet: true },
    })
    if (!receiver) {
      return NextResponse.json({ error: 'Aucun compte ECOPYE avec ce numéro' }, { status: 404 })
    }
    if (!receiver.isActive) {
      return NextResponse.json({ error: 'Le compte destinataire est désactivé' }, { status: 400 })
    }

    const fee = calculateFee(amount)
    const total = amount + fee

    // Vérifier le solde
    const senderBalance = Number(sender.wallet?.balance ?? 0)
    if (senderBalance < total) {
      return NextResponse.json({
        error: `Solde insuffisant. Vous avez ${senderBalance.toLocaleString()} DZD, il faut ${total.toLocaleString()} DZD (dont ${fee.toLocaleString()} DZD de frais)`,
      }, { status: 400 })
    }

    // Transaction atomique
    const [transfer] = await db.$transaction([
      db.transfer.create({
        data: {
          senderId,
          receiverId: receiver.id,
          amount,
          fee,
          description: description?.trim() || null,
          status: 'COMPLETED',
        },
      }),
      db.wallet.update({
        where: { userId: senderId },
        data: { balance: { decrement: total } },
      }),
      db.wallet.update({
        where: { userId: receiver.id },
        data: { balance: { increment: amount } },
      }),
    ])

    // Notifications + audit (fire-and-forget)
    Promise.all([
      createNotification({
        userId: senderId,
        title: 'Transfert envoyé',
        body: `${formatDZD(amount)} envoyés à ${receiver.fullName}`,
        type: 'transfer_sent',
        data: { transferId: transfer.id, amount },
      }),
      createNotification({
        userId: receiver.id,
        title: 'Argent reçu 🎉',
        body: `${formatDZD(amount)} reçus de ${sender.fullName}`,
        type: 'transfer_received',
        data: { transferId: transfer.id, amount },
      }),
      createAuditLog({ userId: senderId, action: 'transfer', resource: 'Transfer', resourceId: transfer.id, metadata: { amount, fee } }),
    ]).catch(() => null)

    return NextResponse.json({
      message: 'Transfert effectué avec succès',
      reference: transfer.reference,
      amount,
      fee,
      recipient: { fullName: receiver.fullName, phone: receiver.phone },
    })
  } catch (error) {
    console.error('[TRANSFER]', error)
    return NextResponse.json({ error: 'Erreur lors du transfert' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const transfers = await db.transfer.findMany({
      where: {
        OR: [{ senderId: session.user.id }, { receiverId: session.user.id }],
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        sender: { select: { fullName: true, phone: true } },
        receiver: { select: { fullName: true, phone: true } },
      },
    })

    return NextResponse.json({ transfers })
  } catch (error) {
    console.error('[TRANSFER_GET]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
