const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyPin } = require('../utils/crypto');
const { authenticate, requireVerified } = require('../middleware/auth');

const prisma = new PrismaClient();

const PROVIDERS = {
  mobilis: { name: 'Mobilis', type: 'mobile', logo: '/logos/mobilis.png', minAmount: 100, maxAmount: 10000 },
  djezzy: { name: 'Djezzy', type: 'mobile', logo: '/logos/djezzy.png', minAmount: 100, maxAmount: 10000 },
  ooredoo: { name: 'Ooredoo', type: 'mobile', logo: '/logos/ooredoo.png', minAmount: 100, maxAmount: 10000 },
  sonelgaz: { name: 'Sonelgaz', type: 'energy', logo: '/logos/sonelgaz.png', minAmount: 500, maxAmount: 100000 },
  seaal: { name: 'SEAAL (Eau)', type: 'water', logo: '/logos/seaal.png', minAmount: 200, maxAmount: 50000 },
  algerie_telecom: { name: 'Algérie Télécom', type: 'telecom', logo: '/logos/at.png', minAmount: 200, maxAmount: 20000 }
};

// GET /api/bills/providers
router.get('/providers', (_, res) => {
  res.json(Object.entries(PROVIDERS).map(([id, info]) => ({ id, ...info })));
});

// POST /api/bills/pay
router.post('/pay', authenticate, requireVerified, [
  body('provider').isIn(Object.keys(PROVIDERS)),
  body('accountNumber').isLength({ min: 6, max: 20 }).withMessage('Numéro de compte invalide'),
  body('amount').isFloat({ min: 100 }).withMessage('Montant minimum 100 DZD'),
  body('pin').isLength({ min: 6, max: 6 }).isNumeric()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { provider, accountNumber, amount, pin } = req.body;

  const pinOk = await verifyPin(pin, req.user.pin);
  if (!pinOk) return res.status(401).json({ error: 'PIN incorrect' });

  const providerInfo = PROVIDERS[provider];
  if (Number(amount) < providerInfo.minAmount || Number(amount) > providerInfo.maxAmount) {
    return res.status(400).json({
      error: `Montant entre ${providerInfo.minAmount} et ${providerInfo.maxAmount} DZD pour ${providerInfo.name}`
    });
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
  if (Number(wallet.balance) < Number(amount)) {
    return res.status(400).json({ error: 'Solde insuffisant' });
  }

  try {
    // Compte système EcoPye qui collecte les paiements de factures
    const systemUser = await prisma.user.findFirst({ where: { phone: process.env.SYSTEM_PHONE } });

    const [bill, transaction] = await prisma.$transaction([
      prisma.billPayment.create({
        data: {
          userId: req.user.id,
          provider,
          accountNumber,
          amount: Number(amount),
          status: 'completed',
          paidAt: new Date()
        }
      }),
      prisma.transaction.create({
        data: {
          senderId: req.user.id,
          receiverId: systemUser?.id || req.user.id,
          amount: Number(amount),
          type: 'bill',
          status: 'completed',
          note: `Facture ${providerInfo.name} - ${accountNumber}`,
          metadata: { provider, accountNumber }
        }
      }),
      prisma.wallet.update({
        where: { userId: req.user.id },
        data: { balance: { decrement: Number(amount) } }
      })
    ]);

    res.json({
      message: `Paiement ${providerInfo.name} de ${amount} DZD effectué`,
      receipt: {
        billId: bill.id,
        reference: transaction.reference,
        provider: providerInfo.name,
        accountNumber,
        amount,
        paidAt: bill.paidAt
      }
    });
  } catch {
    res.status(500).json({ error: 'Échec du paiement de facture' });
  }
});

// GET /api/bills/history
router.get('/history', authenticate, requireVerified, async (req, res) => {
  const bills = await prisma.billPayment.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  res.json(bills.map(b => ({ ...b, providerInfo: PROVIDERS[b.provider] })));
});

module.exports = router;
