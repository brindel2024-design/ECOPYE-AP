import { prisma } from '@ecopye/database';
import { AppError, NotFoundError } from '@ecopye/utils';
import { ERROR_CODES } from '@ecopye/constants';
import type { RegisterAgentDto } from '@ecopye/types';

export async function registerAgent(userId: string, dto: RegisterAgentDto) {
  const existing = await prisma.agent.findUnique({ where: { userId } });
  if (existing) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Agent déjà enregistré', 409);
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.kycLevel !== 'LEVEL_2' && user.kycLevel !== 'LEVEL_3') {
    throw new AppError(ERROR_CODES.KYC_INSUFFICIENT, 'KYC niveau 2 requis pour devenir agent', 403);
  }

  const agent = await prisma.agent.create({
    data: {
      userId,
      businessName: dto.businessName,
      licenseNumber: dto.licenseNumber,
      wilaya: dto.wilaya,
      address: dto.address,
      latitude: dto.latitude,
      longitude: dto.longitude,
      status: 'PENDING',
      wallets: {
        create: {
          userId,
          type: 'AGENT',
          status: 'ACTIVE',
          currency: 'DZD',
          dailyLimit: 500_000_000n,
          monthlyLimit: 15_000_000_000n,
        },
      },
    },
  });
  return { id: agent.id, status: agent.status };
}

export async function getAgent(agentId: string) {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) throw new NotFoundError('Agent');
  return {
    id: agent.id,
    businessName: agent.businessName,
    status: agent.status,
    wilaya: agent.wilaya,
    address: agent.address,
    commissionBps: agent.commissionBps,
    rating: agent.rating?.toString() ?? null,
  };
}

export async function approveAgent(agentId: string) {
  return prisma.agent.update({ where: { id: agentId }, data: { status: 'ACTIVE' } });
}

export async function suspendAgent(agentId: string, reason: string) {
  return prisma.agent.update({
    where: { id: agentId },
    data: { status: 'SUSPENDED', metadata: { suspensionReason: reason } },
  });
}
