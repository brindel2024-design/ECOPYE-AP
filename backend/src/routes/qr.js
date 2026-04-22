const router = require('express').Router();
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const { verifyPin } = require('../utils/crypto');
const { authenticate, requireVerified } = require('../middleware/auth');

const prisma = new PrismaClient();

// POST /api/qr/generate  — générer un QR pour recevoir un paiement
router.post('/generate', authenticate, requireVerified, async (req, res) => {
  const { amount, label, isStatic = false } = req.body;

  const qrPayload = JSON.stringify({
    type: 'ecopye_payment',
    merchantId: req.user.id,
    merchantName: req.user.fullName,
    phone: req.user.phone,
    amount: amount || null,
    label: label || null,
    ref: uuidv4(),
    ts: Date.now()
  });

  const expiresAt = isStatic ? null : new Date(Date.now() + 30 * 60 * 1000);

  const qrRecord = await prisma.qRCode.create({
    data: {
      merchantId: req.user.id,
      amount: amount || null,
      label,
      qrData: qrPayload,
      isStatic,
      expiresAt
    }
  });

  const qrImage = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: 'M',
    width: 300,
    color: { dark: '#10B981', light: '#FFFFFF' }
  });

  res.json({
    qrId: qrRecord.id,
    qrImage,
    payload: qrPayload,
    expiresAt
  });
});

// POST /api/qr/pay  — payer via QR scanné
router.post('/pay', authenticate, requireVerified, async (req, res) => {
  const { qrPayload, pin, amount: overrideAmount } = req.body;

  const pinOk = await verifyPin(pin, req.user.pin);
  if (!pinOk) return res.status(401).json({ error: 'PIN incorrect' });

  let parsed;
  try {
    parsed = JSON.parse(qrPayload);
    if (parsed.type !== 'ecopye_payment') throw new Error();
  } catch {
    return res.status(400).json({ error: 'QR Code invalide' });
  }

  const { merchantId, amount: qrAmount } = parsed;
  const finalAmount = overrideAmount || qrAmount;

  if (!finalAmount || finalAmount < 100) {
    return res.status(400).json({ error: 'Montant requis ou trop faible' });
  }
  if (merchantId === req.user.id) {
    return res.status(400).json({ error: 'Impossible de vous payer vous-même' });
  }

  const qrRecord = await prisma.qRCode.findFirst({
    where: { merchantId, qrData: qrPayload, isUsed: false }
  });

  if (qrRecord?.expiresAt && qrRecord.expiresAt < new Date()) {
    return res.status(400).json({ error: 'QR Code expiré' });
  }

  const senderWallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
  if (Number(senderWallet.balance) < Number(finalAmount)) {
    return res.status(400).json({ error: 'Solde insuffisant' });
  }

  const merchant = await prisma.user.findUnique({
    where: { id: merchantId },
    select: { fullName: true, phone: true }
  });

  const [transaction] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        senderId: req.user.id,
        receiverId: merchantId,
        amount: Number(finalAmount),
        type: 'qr_payment',
        status: 'completed',
        metadata: { qrRef: parsed.ref }
      }
    }),
    prisma.wallet.update({ where: { userId: req.user.id }, data: { balance: { decrement: Number(finalAmount) } } }),
    prisma.wallet.update({ where: { id: merchantId }, data: { balance: { increment: Number(finalAmount) } } })
  ]);

  if (qrRecord && !qrRecord.isStatic) {
    await prisma.qRCode.update({ where: { id: qrRecord.id }, data: { isUsed: true } });
  }

  res.json({
    message: `Paiement de ${finalAmount} DZD à ${merchant.fullName} réussi`,
    transaction: { id: transaction.id, reference: transaction.reference, amount: transaction.amount }
  });
});

module.exports = router;
