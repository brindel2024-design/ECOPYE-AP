import { prisma } from '@ecopye/database';
import {
  AppError,
  UnauthorizedError,
} from '@ecopye/utils';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  ACCOUNT_LOCK_DURATION_SECONDS,
  ERROR_CODES,
  MAX_LOGIN_ATTEMPTS,
} from '@ecopye/constants';
import type { LoginDto, AuthSession } from '@ecopye/types';
import { verifyPin } from './hash';
import { signAccessToken, generateRefreshToken } from './tokens';

interface LoginContext {
  ip?: string;
  userAgent?: string;
}

export async function loginUser(dto: LoginDto, ctx: LoginContext = {}): Promise<AuthSession> {
  const user = await prisma.user.findUnique({
    where: { phoneNumber: dto.phoneNumber },
    include: { profile: true },
  });

  if (!user || user.deletedAt) {
    throw new UnauthorizedError('Identifiants invalides');
  }

  if (user.status === 'BLOCKED' || user.status === 'SUSPENDED') {
    throw new AppError(ERROR_CODES.AUTH_ACCOUNT_LOCKED, 'Compte verrouillé', 403);
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(ERROR_CODES.AUTH_ACCOUNT_LOCKED, 'Compte temporairement verrouillé', 429);
  }

  const ok = await verifyPin(user.pinHash, dto.pin);

  if (!ok) {
    const failed = user.failedLoginCount + 1;
    const shouldLock = failed >= MAX_LOGIN_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failed,
        lockedUntil: shouldLock
          ? new Date(Date.now() + ACCOUNT_LOCK_DURATION_SECONDS * 1000)
          : user.lockedUntil,
      },
    });
    throw new UnauthorizedError('Identifiants invalides');
  }

  const device = await prisma.device.upsert({
    where: { userId_fingerprint: { userId: user.id, fingerprint: dto.deviceFingerprint } },
    update: { lastSeenAt: new Date(), lastIp: ctx.ip },
    create: {
      userId: user.id,
      fingerprint: dto.deviceFingerprint,
      platform: 'unknown',
      lastIp: ctx.ip,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ctx.ip,
    },
  });

  const accessToken = await signAccessToken({
    sub: user.id,
    phoneNumber: user.phoneNumber,
    kycLevel: user.kycLevel,
  });
  const { token: refreshToken, hash, expiresAt } = generateRefreshToken();

  await prisma.session.create({
    data: {
      userId: user.id,
      deviceId: device.id,
      refreshTokenHash: hash,
      ip: ctx.ip,
      userAgent: ctx.userAgent?.slice(0, 500),
      expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      phoneNumber: user.phoneNumber,
      firstName: user.profile?.firstName ?? '',
      lastName: user.profile?.lastName ?? '',
      kycLevel: user.kycLevel,
      status: user.status,
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    },
  };
}
