import { prisma } from '@ecopye/database';
import { NotFoundError } from '@ecopye/utils';
import { KYC_LIMITS, type KycLevelCode } from '@ecopye/constants';
import type { KycStatusView, KycSubmitDto } from '@ecopye/types';

export async function getKycStatus(userId: string): Promise<KycStatusView> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('User');

  const latest = await prisma.kycRecord.findFirst({
    where: { userId },
    orderBy: { startedAt: 'desc' },
  });

  const limits = KYC_LIMITS[user.kycLevel as KycLevelCode];
  return {
    currentLevel: user.kycLevel as KycStatusView['currentLevel'],
    pendingLevel: latest && latest.status === 'PROCESSING' ? latest.requestedLevel : null,
    lastUpdatedAt: latest?.completedAt?.toISOString() ?? latest?.startedAt?.toISOString() ?? null,
    rejectionReason: latest?.rejectionReason ?? null,
    limits: {
      dailyLimit: limits.dailyLimit.toString(),
      monthlyLimit: limits.monthlyLimit.toString(),
      maxSingleTx: limits.maxSingleTx.toString(),
    },
  };
}

export async function submitKyc(userId: string, dto: KycSubmitDto) {
  const record = await prisma.kycRecord.create({
    data: {
      userId,
      requestedLevel: dto.requestedLevel,
      provider: 'onfido',
      status: 'PROCESSING',
      documents: {
        create: dto.documents.map((d) => ({
          userId,
          type: d.type,
          s3Key: d.s3Key,
          checksum: d.checksum,
          status: 'UPLOADED',
        })),
      },
    },
    include: { documents: true },
  });

  // TODO: Trigger async Onfido verification job via BullMQ.
  // For now, leave PROCESSING; worker will call approveKyc() on webhook.

  return {
    recordId: record.id,
    status: record.status,
    submittedAt: record.startedAt.toISOString(),
  };
}

/** Approve / promote KYC level. Called by Onfido webhook handler. */
export async function approveKyc(userId: string, recordId: string, level: KycLevelCode) {
  const limits = KYC_LIMITS[level];
  await prisma.$transaction([
    prisma.kycRecord.update({
      where: { id: recordId },
      data: { status: 'APPROVED', resolvedLevel: level, completedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { kycLevel: level, status: 'ACTIVE' },
    }),
    prisma.wallet.updateMany({
      where: { userId, type: 'PERSONAL' },
      data: {
        dailyLimit: limits.dailyLimit,
        monthlyLimit: limits.monthlyLimit,
      },
    }),
  ]);
}

export async function rejectKyc(recordId: string, reason: string) {
  await prisma.kycRecord.update({
    where: { id: recordId },
    data: { status: 'REJECTED', rejectionReason: reason, completedAt: new Date() },
  });
}
