import { prisma } from '@ecopye/database';
import {
  AppError,
  NotFoundError,
  generateTransactionReference,
} from '@ecopye/utils';
import { ERROR_CODES, MAX_CAGNOTTE_TARGET, MIN_CAGNOTTE_CONTRIBUTION } from '@ecopye/constants';
import type { CreateCagnotteDto, ContributeCagnotteDto, PaginationQuery } from '@ecopye/types';
import { writeBalancedTransfer, assertWithinLimits, resetCountersIfExpired } from '@ecopye/wallet-service';

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) + `-${Math.random().toString(36).slice(2, 8)}`
  );
}

export async function createCagnotte(ownerId: string, dto: CreateCagnotteDto) {
  if (dto.targetAmount > MAX_CAGNOTTE_TARGET) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Objectif trop élevé', 422);
  }
  const cagnotte = await prisma.cagnotte.create({
    data: {
      ownerId,
      title: dto.title,
      description: dto.description,
      targetAmount: dto.targetAmount,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      isPublic: dto.isPublic,
      slug: slugify(dto.title),
      status: 'ACTIVE',
    },
  });
  return { id: cagnotte.id, slug: cagnotte.slug };
}

export async function listMyCagnottes(ownerId: string, q: PaginationQuery) {
  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    prisma.cagnotte.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: q.limit,
    }),
    prisma.cagnotte.count({ where: { ownerId } }),
  ]);
  return {
    items: items.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      status: c.status,
      currentAmount: c.currentAmount.toString(),
      targetAmount: c.targetAmount.toString(),
      deadline: c.deadline?.toISOString() ?? null,
    })),
    pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) },
  };
}

export async function getCagnotteBySlug(slug: string) {
  const c = await prisma.cagnotte.findUnique({
    where: { slug },
    include: {
      owner: { select: { profile: { select: { firstName: true, lastName: true } } } },
      contributions: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: { contributor: { select: { profile: { select: { firstName: true } } } } },
      },
    },
  });
  if (!c || !c.isPublic) throw new NotFoundError('Cagnotte');
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    currentAmount: c.currentAmount.toString(),
    targetAmount: c.targetAmount.toString(),
    status: c.status,
    deadline: c.deadline?.toISOString() ?? null,
    owner: c.owner.profile
      ? `${c.owner.profile.firstName} ${c.owner.profile.lastName.charAt(0)}.`
      : 'Anonyme',
    recentContributions: c.contributions.map((ct) => ({
      amount: ct.amount.toString(),
      name: ct.isAnonymous ? 'Anonyme' : (ct.contributor?.profile?.firstName ?? 'Anonyme'),
      message: ct.message,
      at: ct.createdAt.toISOString(),
    })),
  };
}

export async function contributeToCagnotte(
  contributorId: string,
  dto: ContributeCagnotteDto,
  idempotencyKey: string,
) {
  if (dto.amount < MIN_CAGNOTTE_CONTRIBUTION) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Montant minimum non atteint', 422);
  }
  const existing = await prisma.transaction.findUnique({ where: { idempotencyKey } });
  if (existing) return { reference: existing.reference, status: existing.status, replayed: true };

  const cagnotte = await prisma.cagnotte.findUnique({
    where: { id: dto.cagnotteId },
    include: { owner: { include: { wallets: { where: { type: 'PERSONAL' } } } } },
  });
  if (!cagnotte || cagnotte.status !== 'ACTIVE') throw new NotFoundError('Cagnotte');
  const ownerWallet = cagnotte.owner.wallets[0];
  if (!ownerWallet) throw new NotFoundError('Wallet bénéficiaire');

  const contributor = await prisma.user.findUniqueOrThrow({
    where: { id: contributorId },
    include: { wallets: { where: { type: 'PERSONAL' } } },
  });
  const contributorWallet = contributor.wallets[0];
  if (!contributorWallet) throw new NotFoundError('Wallet');

  const reference = generateTransactionReference();

  const tx = await prisma.$transaction(async (tx) => {
    await resetCountersIfExpired(tx, contributorWallet.id);
    const w = await tx.wallet.findUniqueOrThrow({ where: { id: contributorWallet.id } });
    assertWithinLimits(w, contributor.kycLevel, dto.amount);

    const row = await tx.transaction.create({
      data: {
        reference,
        idempotencyKey,
        type: 'CAGNOTTE_CONTRIBUTION',
        status: 'PROCESSING',
        currency: 'DZD',
        amount: dto.amount,
        senderId: contributor.id,
        senderWalletId: contributorWallet.id,
        receiverId: cagnotte.ownerId,
        receiverWalletId: ownerWallet.id,
        description: `Cagnotte: ${cagnotte.title}`,
      },
    });

    await writeBalancedTransfer(tx, {
      transactionId: row.id,
      fromWalletId: contributorWallet.id,
      toWalletId: ownerWallet.id,
      amount: dto.amount,
      currency: 'DZD',
    });

    await tx.cagnotteContribution.create({
      data: {
        cagnotteId: cagnotte.id,
        contributorId: dto.isAnonymous ? null : contributor.id,
        amount: dto.amount,
        message: dto.message,
        isAnonymous: dto.isAnonymous,
        transactionId: row.id,
      },
    });
    await tx.cagnotte.update({
      where: { id: cagnotte.id },
      data: { currentAmount: cagnotte.currentAmount + dto.amount },
    });

    return tx.transaction.update({
      where: { id: row.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  });

  return { reference: tx.reference, status: tx.status };
}
