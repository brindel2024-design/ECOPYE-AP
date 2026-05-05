import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

function luhnCheck(raw: string): boolean {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10)
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

function validateExpiry(expiry: string): boolean {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/)
  if (!match) return false
  const month = parseInt(match[1], 10)
  const year = parseInt('20' + match[2], 10)
  if (month < 1 || month > 12) return false
  const now = new Date()
  const exp = new Date(year, month - 1, 1)
  return exp >= new Date(now.getFullYear(), now.getMonth(), 1)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await req.json()
    const { cardNumber, holderName, expiry, cvv, amount, merchantName, merchantId, description } = body

    // Validation carte
    const cleanCard = (cardNumber ?? '').replace(/\s/g, '')
    if (!luhnCheck(cleanCard)) {
      return NextResponse.json({ error: 'Numéro de carte invalide' }, { status: 400 })
    }
    if (!holderName?.trim()) {
      return NextResponse.json({ error: 'Nom du titulaire requis' }, { status: 400 })
    }
    if (!validateExpiry(expiry ?? '')) {
      return NextResponse.json({ error: 'Date d\'expiration invalide ou carte expirée' }, { status: 400 })
    }
    if (!/^\d{3}$/.test(cvv ?? '')) {
      return NextResponse.json({ error: 'CVV invalide (3 chiffres requis)' }, { status: 400 })
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) < 100) {
      return NextResponse.json({ error: 'Montant minimum: 100 DZD' }, { status: 400 })
    }
    if (!merchantName?.trim()) {
      return NextResponse.json({ error: 'Nom du marchand requis' }, { status: 400 })
    }

    // Déterminer le réseau carte
    const first = cleanCard[0]
    let paymentMethod: 'CIB' | 'BARIDIMOB' | 'DAHABIA' = 'CIB'
    if (first === '6') paymentMethod = 'DAHABIA'
    else if (first === '9') paymentMethod = 'BARIDIMOB'

    // Vérifier le portefeuille (les paiements carte débitent aussi le solde EcoPye)
    const wallet = await db.wallet.findUnique({ where: { userId: session.user.id } })
    if (!wallet) {
      return NextResponse.json({ error: 'Portefeuille introuvable' }, { status: 404 })
    }
    if (wallet.isLocked) {
      return NextResponse.json({ error: 'Portefeuille temporairement bloqué' }, { status: 403 })
    }
    if (Number(wallet.balance) < Number(amount)) {
      return NextResponse.json({
        error: `Solde insuffisant. Disponible: ${Number(wallet.balance).toLocaleString('fr-DZ')} DZD`,
      }, { status: 400 })
    }

    // Transaction atomique
    const [payment] = await db.$transaction([
      db.payment.create({
        data: {
          userId: session.user.id,
          merchantName: merchantName.trim(),
          merchantId: merchantId ?? null,
          amount: Number(amount),
          description: description?.trim() || `Paiement carte ${paymentMethod} — ${merchantName}`,
          status: 'COMPLETED',
          paymentMethod,
        },
      }),
      db.wallet.update({
        where: { userId: session.user.id },
        data: { balance: { decrement: Number(amount) } },
      }),
    ])

    return NextResponse.json({
      success: true,
      reference: payment.reference,
      amount: Number(amount),
      merchantName: merchantName.trim(),
      paymentMethod,
      maskedCard: `**** **** **** ${cleanCard.slice(-4)}`,
    })
  } catch (error) {
    console.error('[PAYMENT_CARD]', error)
    return NextResponse.json({ error: 'Erreur lors du paiement par carte' }, { status: 500 })
  }
}
