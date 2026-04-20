import { prisma } from '@ecopye/database';
import { ConflictError } from '@ecopye/utils';
import { KYC_LIMITS } from '@ecopye/constants';
import type { RegisterDto, AuthSession } from '@ecopye/types';
import { hashPin } from './hash';
import { signAccessToken, generateRefreshToken } from './tokens';
import { ACCESS_TOKEN_TTL_SECONDS } from '@ecopye/constants';

interface RegisterContext {
  ip?: string;
  userAgent?: string;
}

export async function registerUser(dto: RegisterDto, ctx: RegisterContext = {}): Promise<AuthSession> {
  const existing = await prisma.user.findUnique({ where: { phoneNumber: dto.phoneNumber } });
  if (existing) throw new ConflictError('Numéro déjà enregistré');

  const pinHash = await hashPin(dto.pin);
  const limits = KYC_LIMITS.LEVEL_1;

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        phoneNumber: dto.phoneNumber,
        pinHash,
        status: 'PENDING',
        kycLevel: 'LEVEL_0',
        locale: dto.locale,
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        },
        wallets: {
          create: {
            type: 'PERSONAL',
            status: 'ACTIVE',
            currency: 'DZD',
            dailyLimit: limits.dailyLimit,
            monthlyLimit: limits.monthlyLimit,
          },
        },
        devices: {
          create: {
            fingerprint: dto.deviceFingerprint,
            platform: 'unknown',
          },
        },
      },
      include: { profile: true, devices: true },
    });
    return u;
  });

  const device = user.devices[0];
  const accessToken = await signAccessToken({
    sub: user.id,
    phoneNumber: user.phoneNumber,
    kycLevel: user.kycLevel,
  });
  const { token: refreshToken, hash, expiresAt } = generateRefreshToken();

  await prisma.session.create({
    data: {
      userId: user.id,
      deviceId: device?.id,
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
