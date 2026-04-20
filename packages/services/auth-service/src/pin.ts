import { prisma } from '@ecopye/database';
import { UnauthorizedError } from '@ecopye/utils';
import type { ChangePinDto } from '@ecopye/types';
import { hashPin, verifyPin } from './hash';

export async function changePin(userId: string, dto: ChangePinDto) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) throw new UnauthorizedError();
  const ok = await verifyPin(user.pinHash, dto.currentPin);
  if (!ok) throw new UnauthorizedError('PIN actuel incorrect');

  const newHash = await hashPin(dto.newPin);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { pinHash: newHash, pinUpdatedAt: new Date() },
    }),
    // Revoke all active sessions to force re-login
    prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
  return { changed: true };
}
