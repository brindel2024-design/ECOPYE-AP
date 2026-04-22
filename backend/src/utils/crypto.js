const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const hashPin = async (pin) => bcrypt.hash(pin, 12);
const verifyPin = async (pin, hash) => bcrypt.compare(pin, hash);

const generateToken = (userId, expiresIn = '7d') =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Encrypt face descriptor before storing (AES-256-GCM)
const encryptFaceDescriptor = (descriptor) => {
  const key = Buffer.from(process.env.FACE_ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(descriptor), 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

const decryptFaceDescriptor = (encryptedData) => {
  const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');
  const key = Buffer.from(process.env.FACE_ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
};

const generateShareCode = () =>
  crypto.randomBytes(4).toString('hex').toUpperCase();

module.exports = {
  hashPin, verifyPin, generateToken, generateOTP,
  encryptFaceDescriptor, decryptFaceDescriptor, generateShareCode
};
