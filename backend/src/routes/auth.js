const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const speakeasy = require('speakeasy');
const { PrismaClient } = require('@prisma/client');
const {
  hashPin, verifyPin, generateToken, generateOTP,
  encryptFaceDescriptor, decryptFaceDescriptor
} = require('../utils/crypto');
const { sendOTP } = require('../services/sms');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

// POST /api/auth/send-otp
router.post('/send-otp', authLimiter, [
  body('phone').matches(/^\+213[5-7]\d{8}$/).withMessage('Numéro algérien invalide (+213XXXXXXXXX)')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { phone, purpose = 'register' } = req.body;
  try {
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.oTPCode.deleteMany({ where: { phone, purpose } });
    await prisma.oTPCode.create({ data: { phone, code, purpose, expiresAt } });
    await sendOTP(phone, code, purpose);

    res.json({ message: 'Code OTP envoyé', expiresIn: 600 });
  } catch (err) {
    res.status(500).json({ error: 'Impossible d\'envoyer le code SMS' });
  }
});

// POST /api/auth/register
router.post('/register', authLimiter, [
  body('phone').matches(/^\+213[5-7]\d{8}$/).withMessage('Numéro algérien invalide'),
  body('fullName').trim().isLength({ min: 3, max: 60 }).withMessage('Nom complet requis'),
  body('pin').isLength({ min: 6, max: 6 }).isNumeric().withMessage('PIN doit être 6 chiffres'),
  body('otpCode').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Code OTP invalide')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { phone, fullName, pin, otpCode, email } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return res.status(409).json({ error: 'Ce numéro est déjà enregistré' });

    const otp = await prisma.oTPCode.findFirst({
      where: { phone, code: otpCode, purpose: 'register', isUsed: false, expiresAt: { gt: new Date() } }
    });
    if (!otp) return res.status(400).json({ error: 'Code OTP invalide ou expiré' });

    const hashedPin = await hashPin(pin);

    const user = await prisma.user.create({
      data: {
        phone, fullName, email,
        pin: hashedPin,
        wallet: { create: { balance: 0, currency: 'DZD' } }
      },
      include: { wallet: true }
    });

    await prisma.oTPCode.update({ where: { id: otp.id }, data: { isUsed: true } });

    const token = generateToken(user.id);
    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      user: { id: user.id, phone: user.phone, fullName: user.fullName, isVerified: user.isVerified },
      nextStep: 'face-setup'
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, [
  body('phone').matches(/^\+213[5-7]\d{8}$/),
  body('pin').isLength({ min: 6, max: 6 }).isNumeric()
], async (req, res) => {
  const { phone, pin, totpCode } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { phone, isActive: true },
      include: { wallet: true }
    });
    if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });

    const pinOk = await verifyPin(pin, user.pin);
    if (!pinOk) return res.status(401).json({ error: 'Identifiants incorrects' });

    // TOTP 2FA
    if (user.totpEnabled) {
      if (!totpCode) return res.status(200).json({ requireTotp: true });
      const valid = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token: totpCode,
        window: 2
      });
      if (!valid) return res.status(401).json({ error: 'Code 2FA invalide' });
    }

    const token = generateToken(user.id);
    const requireFace = user.faceDescriptor !== null;

    res.json({
      token,
      requireFaceAuth: requireFace,
      user: {
        id: user.id, phone: user.phone, fullName: user.fullName,
        isVerified: user.isVerified, totpEnabled: user.totpEnabled,
        kycStatus: user.kycStatus
      }
    });
  } catch {
    res.status(500).json({ error: 'Erreur de connexion' });
  }
});

// POST /api/auth/setup-face  (enregistrement descripteur facial)
router.post('/setup-face', authenticate, async (req, res) => {
  const { faceDescriptor } = req.body;
  if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
    return res.status(400).json({ error: 'Descripteur facial invalide' });
  }

  try {
    const encrypted = encryptFaceDescriptor(faceDescriptor);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { faceDescriptor: encrypted, isVerified: true }
    });
    res.json({ message: 'Reconnaissance faciale configurée avec succès' });
  } catch {
    res.status(500).json({ error: 'Erreur configuration reconnaissance faciale' });
  }
});

// POST /api/auth/verify-face  (authentification faciale)
router.post('/verify-face', authenticate, async (req, res) => {
  const { faceDescriptor } = req.body;
  if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
    return res.status(400).json({ error: 'Descripteur facial manquant' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.faceDescriptor) {
      return res.status(400).json({ error: 'Aucun visage enregistré' });
    }

    const stored = decryptFaceDescriptor(user.faceDescriptor);

    // Distance euclidienne entre les deux descripteurs
    const distance = Math.sqrt(
      stored.reduce((sum, val, i) => sum + (val - faceDescriptor[i]) ** 2, 0)
    );

    const THRESHOLD = 0.5;
    if (distance > THRESHOLD) {
      return res.status(401).json({ error: 'Visage non reconnu', distance });
    }

    res.json({ verified: true, confidence: Math.max(0, 1 - distance / THRESHOLD) });
  } catch {
    res.status(500).json({ error: 'Erreur vérification faciale' });
  }
});

// POST /api/auth/setup-totp
router.post('/setup-totp', authenticate, async (req, res) => {
  const secret = speakeasy.generateSecret({
    name: `EcoPye (${req.user.phone})`,
    length: 20
  });

  await prisma.user.update({
    where: { id: req.user.id },
    data: { totpSecret: secret.base32 }
  });

  res.json({
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qrData: secret.otpauth_url
  });
});

// POST /api/auth/confirm-totp
router.post('/confirm-totp', authenticate, async (req, res) => {
  const { token } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  const valid = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token,
    window: 2
  });

  if (!valid) return res.status(400).json({ error: 'Code TOTP invalide' });

  await prisma.user.update({ where: { id: req.user.id }, data: { totpEnabled: true } });
  res.json({ message: 'Authentification à deux facteurs activée' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const { id, phone, fullName, email, isVerified, kycStatus, totpEnabled, wallet } = req.user;
  res.json({ id, phone, fullName, email, isVerified, kycStatus, totpEnabled, wallet });
});

module.exports = router;
