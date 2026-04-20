import { randomBytes, createHash } from 'node:crypto';

/** Generate a transaction reference like `ECP-2026-7F3A2B9C1D`. */
export function generateTransactionReference(prefix = 'ECP'): string {
  const year = new Date().getUTCFullYear();
  const tail = randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}-${year}-${tail}`;
}

/** Stable 8-char code for cash operations at counters. */
export function generateCashCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
  const bytes = randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) {
    const byte = bytes[i] ?? 0;
    const char = alphabet[byte % alphabet.length];
    out += char ?? 'X';
  }
  return out;
}

/** Hash an idempotency key deterministically (for indexing). */
export function hashIdempotencyKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}
