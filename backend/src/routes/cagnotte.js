const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { verifyPin, generateShareCode } = require('../utils/crypto');
const { authenticate, requireVerified } = require('../middleware/auth');

const prisma = new PrismaClient();

// POST /api/cagnotte/create
router.post('/create', authenticate, requireVerified, [
  body('title').trim().isLength({ min: 3, max: 100 }),
  body('type').isIn(['charity', 'family', 'event']),
  body('description').optional().isLength({ max: 500 }),
  body('targetAmount').optional().isFloat({ min: 1000 }),
  body('isPublic').optional().isBoolean(),
  body('deadline').optional().isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, type, description, targetAmount, isPublic = true, deadline } = req.body;

  const cagnotte = await prisma.cagnotte.create({
    data: {
      creatorId: req.user.id,
      title, type, description,
      targetAmount: targetAmount || null,
      isPublic,
      shareCode: generateShareCode(),
      deadline: deadline ? new Date(deadline) : null
    },
    include: {
      creator: { select: { fullName: true, phone: true } }
    }
  });

  res.status(201).json({
    message: 'Cagnotte créée avec succès',
    cagnotte,
    shareUrl: `${process.env.FRONTEND_URL}/cagnotte/${cagnotte.shareCode}`
  });
});

// GET /api/cagnotte  — mes cagnottes
router.get('/', authenticate, requireVerified, async (req, res) => {
  const cagnottes = await prisma.cagnotte.findMany({
    where: { creatorId: req.user.id },
    include: {
      _count: { select: { contributions: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(cagnottes);
});

// GET /api/cagnotte/public  — cagnottes publiques (découverte)
router.get('/public', authenticate, async (req, res) => {
  const { type, search } = req.query;
  const cagnottes = await prisma.cagnotte.findMany({
    where: {
      isPublic: true, isActive: true,
      ...(type && { type }),
      ...(search && { title: { contains: search } })
    },
    include: {
      creator: { select: { fullName: true } },
      _count: { select: { contributions: true } }
    },
    orderBy: { currentAmount: 'desc' },
    take: 20
  });
  res.json(cagnottes);
});

// GET /api/cagnotte/:shareCode  — détail par code de partage
router.get('/:shareCode', authenticate, async (req, res) => {
  const cagnotte = await prisma.cagnotte.findUnique({
    where: { shareCode: req.params.shareCode },
    include: {
      creator: { select: { fullName: true } },
      contributions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { fullName: true } }
        }
      },
      _count: { select: { contributions: true } }
    }
  });

  if (!cagnotte) return res.status(404).json({ error: 'Cagnotte introuvable' });
  if (!cagnotte.isPublic && cagnotte.creatorId !== req.user.id) {
    return res.status(403).json({ error: 'Cagnotte privée' });
  }

  const progress = cagnotte.targetAmount
    ? Math.min(100, (Number(cagnotte.currentAmount) / Number(cagnotte.targetAmount)) * 100)
    : null;

  res.json({ ...cagnotte, progress });
});

// POST /api/cagnotte/:shareCode/contribute
router.post('/:shareCode/contribute', authenticate, requireVerified, [
  body('amount').isFloat({ min: 100, max: 1000000 }),
  body('pin').isLength({ min: 6, max: 6 }).isNumeric(),
  body('message').optional().isLength({ max: 200 }),
  body('isAnonymous').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { amount, pin, message, isAnonymous = false } = req.body;

  const pinOk = await verifyPin(pin, req.user.pin);
  if (!pinOk) return res.status(401).json({ error: 'PIN incorrect' });

  const cagnotte = await prisma.cagnotte.findUnique({
    where: { shareCode: req.params.shareCode }
  });
  if (!cagnotte || !cagnotte.isActive) {
    return res.status(404).json({ error: 'Cagnotte introuvable ou inactive' });
  }
  if (cagnotte.deadline && cagnotte.deadline < new Date()) {
    return res.status(400).json({ error: 'Cette cagnotte est terminée' });
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
  if (Number(wallet.balance) < Number(amount)) {
    return res.status(400).json({ error: 'Solde insuffisant' });
  }

  await prisma.$transaction([
    prisma.cagnotteContribution.create({
      data: { cagnotteId: cagnotte.id, userId: req.user.id, amount: Number(amount), message, isAnonymous }
    }),
    prisma.cagnotte.update({
      where: { id: cagnotte.id },
      data: { currentAmount: { increment: Number(amount) } }
    }),
    prisma.transaction.create({
      data: {
        senderId: req.user.id,
        receiverId: cagnotte.creatorId,
        amount: Number(amount),
        type: 'cagnotte',
        status: 'completed',
        note: `Contribution: ${cagnotte.title}`,
        metadata: { cagnotteId: cagnotte.id, isAnonymous }
      }
    }),
    prisma.wallet.update({ where: { userId: req.user.id }, data: { balance: { decrement: Number(amount) } } }),
    prisma.wallet.update({ where: { userId: cagnotte.creatorId }, data: { balance: { increment: Number(amount) } } })
  ]);

  res.json({ message: `Contribution de ${amount} DZD enregistrée. Merci !` });
});

// PATCH /api/cagnotte/:id/close
router.patch('/:id/close', authenticate, requireVerified, async (req, res) => {
  const cagnotte = await prisma.cagnotte.findUnique({ where: { id: req.params.id } });
  if (!cagnotte || cagnotte.creatorId !== req.user.id) {
    return res.status(403).json({ error: 'Non autorisé' });
  }
  await prisma.cagnotte.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'Cagnotte clôturée' });
});

module.exports = router;
