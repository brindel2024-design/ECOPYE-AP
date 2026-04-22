const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
      include: { wallet: true }
    });
    if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({ error: 'Compte non vérifié. Complétez la configuration.' });
  }
  next();
};

const requireKYC = (req, res, next) => {
  if (req.user.kycStatus !== 'verified') {
    return res.status(403).json({ error: 'Vérification d\'identité requise pour cette opération.' });
  }
  next();
};

module.exports = { authenticate, requireVerified, requireKYC };
