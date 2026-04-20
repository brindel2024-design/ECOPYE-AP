import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';
import { readFileSync } from 'node:fs';
import { randomBytes, createHash } from 'node:crypto';
import { loadConfig } from '@ecopye/config';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from '@ecopye/constants';

export interface AccessTokenPayload {
  sub: string;
  phoneNumber: string;
  kycLevel: string;
  role: 'user' | 'merchant' | 'agent' | 'admin';
  jti: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface TokenContext {
  issuer: string;
  audience: string;
}

let cachedPrivateKey: CryptoKey | null = null;
let cachedPublicKey: CryptoKey | null = null;

async function getPrivateKey(): Promise<CryptoKey> {
  if (cachedPrivateKey) return cachedPrivateKey;
  const config = loadConfig();
  const pem = readFileSync(config.JWT_PRIVATE_KEY_PATH, 'utf8');
  cachedPrivateKey = await importPKCS8(pem, 'RS256');
  return cachedPrivateKey;
}

async function getPublicKey(): Promise<CryptoKey> {
  if (cachedPublicKey) return cachedPublicKey;
  const config = loadConfig();
  const pem = readFileSync(config.JWT_PUBLIC_KEY_PATH, 'utf8');
  cachedPublicKey = await importSPKI(pem, 'RS256');
  return cachedPublicKey;
}

export async function signAccessToken(payload: {
  sub: string;
  phoneNumber: string;
  kycLevel: string;
  role?: AccessTokenPayload['role'];
}): Promise<string> {
  const config = loadConfig();
  const key = await getPrivateKey();
  const jti = randomBytes(16).toString('hex');

  return new SignJWT({
    phoneNumber: payload.phoneNumber,
    kycLevel: payload.kycLevel,
    role: payload.role ?? 'user',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setSubject(payload.sub)
    .setJti(jti)
    .setIssuer(config.JWT_ISSUER)
    .setAudience(config.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(key);
}

export async function verifyAccessToken(
  token: string,
  _publicKeyPem?: string,
  ctx?: Partial<TokenContext>,
): Promise<AccessTokenPayload> {
  const config = loadConfig();
  const key = await getPublicKey();
  const { payload } = await jwtVerify(token, key, {
    issuer: ctx?.issuer ?? config.JWT_ISSUER,
    audience: ctx?.audience ?? config.JWT_AUDIENCE,
    algorithms: ['RS256'],
  });
  return payload as unknown as AccessTokenPayload;
}

/**
 * Refresh tokens are opaque (not JWTs) so they can be revoked server-side.
 * We return the plaintext to the client and store a SHA-256 hash in DB.
 */
export function generateRefreshToken(): { token: string; hash: string; expiresAt: Date } {
  const token = randomBytes(48).toString('base64url');
  const hash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
  return { token, hash, expiresAt };
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
