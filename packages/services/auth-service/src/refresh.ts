import { prisma } from '@ecopye/database';
import { UnauthorizedError } from '@ecopye/utils';
import { ACCESS_TOKEN_TTL_SECONDS } from '@ecopye/constants';
import type { RefreshDto } from '@ecopye/types';
import { hashRefreshToken, generateRefreshToken, signAccessToken } from './tokens';

export async function refreshSession(dto: RefreshDto) {
  const hash = hashRefreshToken(dto.refreshToken);
  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: hash },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new UnauthorizedError('Session invalide ou expirée');
  }
  if (!session.user || session.user.deletedAt) {
    throw new UnauthorizedError('Utilisateur introuvable');
  }

  // Rotate — revoke old session, issue a new one
  const { token: newRefresh, hash: newHash, expiresAt } = generateRefreshToken();

  await prisma.$transaction([
    prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    }),
    prisma.session.create({
      data: {
        userId: session.userId,
        deviceId: session.deviceId,
        refreshTokenHash: newHash,
        ip: session.ip,
        userAgent: session.userAgent,
        expiresAt,
      },
    }),
  ]);

  const accessToken = await signAccessToken({
    sub: session.user.id,
    phoneNumber: session.user.phoneNumber,
    kycLevel: session.user.kycLevel,
  });

  return {
    accessToken,
    refreshToken: newRefresh,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}
