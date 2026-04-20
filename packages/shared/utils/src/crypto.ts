import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

const AES_ALGO = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended
const TAG_LENGTH = 16;

/** Encrypt with AES-256-GCM. Returns `iv:tag:ciphertext` as base64url. */
export function encrypt(plaintext: string, keyHex: string): string {
  const key = keyFromHex(keyHex);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(AES_ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ct].map((b) => b.toString('base64url')).join('.');
}

export function decrypt(payload: string, keyHex: string): string {
  const parts = payload.split('.');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format');
  const [ivRaw, tagRaw, ctRaw] = parts;
  if (!ivRaw || !tagRaw || !ctRaw) throw new Error('Invalid ciphertext format');
  const iv = Buffer.from(ivRaw, 'base64url');
  const tag = Buffer.from(tagRaw, 'base64url');
  const ct = Buffer.from(ctRaw, 'base64url');
  if (tag.length !== TAG_LENGTH) throw new Error('Invalid auth tag');
  const key = keyFromHex(keyHex);
  const decipher = createDecipheriv(AES_ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString('utf8');
}

function keyFromHex(hex: string): Buffer {
  const buf = Buffer.from(hex, 'hex');
  if (buf.length !== 32) {
    throw new Error('AES key must be 32 bytes (64 hex chars)');
  }
  return buf;
}

/** Deterministic sha256 hex. */
export function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

/** HMAC-SHA256 hex. */
export function hmac(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/** Constant-time comparison. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
