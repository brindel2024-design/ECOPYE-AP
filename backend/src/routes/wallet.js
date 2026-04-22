const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireVerified } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/wallet  — solde + résumé
router.get('/', authenticate, requireVerified, async (req, res) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
  res.json({ balance: wallet.balance, currency: wallet.currency, isLocked: wallet.isLocked });
});

// GET /api/wallet/transactions  — historique
router.get('/transactions', authenticate, requireVerified, async (req, res) => {
  const { page = 1, limit = 20, type } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    OR: [{ senderId: req.user.id }, { receiverId: req.user.id }],
    ...(type && { type })
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        sender: { select: { fullName: true, phone: true } },
        receiver: { select: { fullName: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.transaction.count({ where })
  ]);

  // Enrichit chaque tx avec direction
  const enriched = transactions.map(tx => ({
    ...tx,
    direction: tx.senderId === req.user.id ? 'debit' : 'credit'
  }));

  res.json({ transactions: enriched, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// GET /api/wallet/stats  — stats mensuelle
router.get('/stats', authenticate, requireVerified, async (req, res) => {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [sent, received] = await Promise.all([
    prisma.transaction.aggregate({
      where: { senderId: req.user.id, status: 'completed', createdAt: { gte: startOfMonth } },
      _sum: { amount: true }, _count: true
    }),
    prisma.transaction.aggregate({
      where: { receiverId: req.user.id, status: 'completed', createdAt: { gte: startOfMonth } },
      _sum: { amount: true }, _count: true
    })
  ]);

  res.json({
    month: new Date().toLocaleString('fr-DZ', { month: 'long', year: 'numeric' }),
    sent: { total: sent._sum.amount || 0, count: sent._count },
    received: { total: received._sum.amount || 0, count: received._count }
  });
});

module.exports = router;
