const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const { verifyPin, decryptFaceDescriptor } = require('../utils/crypto');
const { authenticate, requireVerified } = require('../middleware/auth');

const prisma = new PrismaClient();

const transferLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

// POST /api/transfer/lookup  — chercher un destinataire par téléphone
router.post('/lookup', authenticate, requireVerified, [
  body('phone').matches(/^\+213[5-7]\d{8}$/)
], async (req, res) => {
  const { phone } = req.body;
  if (phone === req.user.phone) return res.status(400).json({ error: 'Vous ne pouvez pas vous envoyer de l\'argent' });

  const user = await prisma.user.findUnique({
    where: { phone, isActive: true },
    select: { id: true, fullName: true, phone: true, isVerified: true }
  });

  if (!user) return res.status(404).json({ error: 'Aucun compte EcoPye trouvé pour ce numéro' });
  res.json({ user });
});

// POST /api/transfer/send
router.post('/send', authenticate, requireVerified, transferLimiter, [
  body('receiverPhone').matches(/^\+213[5-7]\d{8}$/),
  body('amount').isFloat({ min: 100, max: 200000 }).withMessage('Montant entre 100 et 200 000 DZD'),
  body('pin').isLength({ min: 6, max: 6 }).isNumeric(),
  body('note').optional().isLength({ max: 140 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { receiverPhone, amount, pin, note, faceDescriptor } = req.body;

  // Vérification PIN
  const pinOk = await verifyPin(pin, req.user.pin);
  if (!pinOk) return res.status(401).json({ error: 'PIN incorrect' });

  // Si faceDescriptor fourni, on vérifie
  if (faceDescriptor && req.user.faceDescriptor) {
    const stored = decryptFaceDescriptor(req.user.faceDescriptor);
    const distance = Math.sqrt(stored.reduce((s, v, i) => s + (v - faceDescriptor[i]) ** 2, 0));
    if (distance > 0.5) return res.status(401).json({ error: 'Vérification faciale échouée' });
  }

  try {
    const receiver = await prisma.user.findUnique({
      where: { phone: receiverPhone, isActive: true },
      include: { wallet: true }
    });
    if (!receiver) return res.status(404).json({ error: 'Destinataire introuvable' });
    if (receiver.wallet.isLocked) return res.status(400).json({ error: 'Compte destinataire verrouillé' });

    const senderWallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
    if (senderWallet.isLocked) return res.status(400).json({ error: 'Votre compte est verrouillé' });
    if (Number(senderWallet.balance) < Number(amount)) {
      return res.status(400).json({ error: 'Solde insuffisant' });
    }

    // Transaction atomique Prisma
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          senderId: req.user.id,
          receiverId: receiver.id,
          amount: Number(amount),
          type: 'p2p',
          status: 'completed',
          note
        }
      }),
      prisma.wallet.update({
        where: { userId: req.user.id },
        data: { balance: { decrement: Number(amount) } }
      }),
      prisma.wallet.update({
        where: { userId: receiver.id },
        data: { balance: { increment: Number(amount) } }
      })
    ]);

    res.json({
      message: `${amount} DZD envoyés à ${receiver.fullName}`,
      transaction: {
        id: transaction.id,
        reference: transaction.reference,
        amount: transaction.amount,
        receiverName: receiver.fullName
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Échec du transfert' });
  }
});

module.exports = router;
