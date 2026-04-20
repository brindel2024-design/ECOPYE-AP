import { randomBytes } from 'node:crypto';
import { prisma } from '@ecopye/database';
import { ForbiddenError, NotFoundError } from '@ecopye/utils';
import type { CreateMerchantDto, CreateTerminalDto, PaginationQuery } from '@ecopye/types';

async function assertIsMember(userId: string, merchantId: string, minRole: 'OWNER' | 'ADMIN' | 'STAFF' = 'STAFF') {
  const member = await prisma.merchantMember.findUnique({
    where: { merchantId_userId: { merchantId, userId } },
  });
  if (!member) throw new ForbiddenError();
  const rank = { OWNER: 3, ADMIN: 2, STAFF: 1, VIEWER: 0 } as const;
  if ((rank[member.role as keyof typeof rank] ?? 0) < rank[minRole]) {
    throw new ForbiddenError();
  }
  return member;
}

export async function createMerchant(userId: string, dto: CreateMerchantDto) {
  const merchant = await prisma.merchant.create({
    data: {
      legalName: dto.legalName,
      tradingName: dto.tradingName,
      type: dto.type,
      status: 'PENDING_REVIEW',
      taxId: dto.taxId,
      commercialRegister: dto.commercialRegister,
      wilaya: dto.wilaya,
      address: dto.address,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      mcc: dto.mcc,
      wallets: {
        create: {
          type: 'MERCHANT',
          status: 'ACTIVE',
          currency: 'DZD',
          dailyLimit: 1_000_000_000n,
          monthlyLimit: 30_000_000_000n,
        },
      },
      members: { create: { userId, role: 'OWNER' } },
    },
  });
  return { id: merchant.id, status: merchant.status, legalName: merchant.legalName };
}

export async function listMyMerchants(userId: string) {
  const rows = await prisma.merchantMember.findMany({
    where: { userId },
    include: { merchant: true },
  });
  return rows.map((r) => ({
    id: r.merchant.id,
    legalName: r.merchant.legalName,
    tradingName: r.merchant.tradingName,
    status: r.merchant.status,
    role: r.role,
  }));
}

export async function createTerminal(userId: string, merchantId: string, dto: CreateTerminalDto) {
  await assertIsMember(userId, merchantId, 'ADMIN');
  const qrPayload = Buffer.from(
    JSON.stringify({
      version: 1,
      type: dto.type === 'STATIC_QR' ? 'static' : 'dynamic',
      merchantId,
      terminalId: randomBytes(8).toString('hex'),
      nonce: randomBytes(4).toString('hex'),
    }),
  ).toString('base64url');

  const terminal = await prisma.terminal.create({
    data: {
      merchantId,
      type: dto.type,
      label: dto.label,
      qrPayload,
    },
  });
  return { id: terminal.id, qrPayload: terminal.qrPayload };
}

export async function getMerchantStats(userId: string, merchantId: string) {
  await assertIsMember(userId, merchantId, 'STAFF');
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [today, month, total] = await Promise.all([
    prisma.transaction.aggregate({
      where: { merchantId, status: 'COMPLETED', createdAt: { gte: startOfDay } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { merchantId, status: 'COMPLETED', createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { merchantId, status: 'COMPLETED' },
      _sum: { amount: true, fee: true },
      _count: true,
    }),
  ]);

  return {
    today: { count: today._count, volume: (today._sum.amount ?? 0n).toString() },
    month: { count: month._count, volume: (month._sum.amount ?? 0n).toString() },
    lifetime: {
      count: total._count,
      volume: (total._sum.amount ?? 0n).toString(),
      feesPaid: (total._sum.fee ?? 0n).toString(),
    },
  };
}

export async function listMerchantTransactions(userId: string, merchantId: string, q: PaginationQuery) {
  await assertIsMember(userId, merchantId, 'STAFF');
  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: q.limit,
    }),
    prisma.transaction.count({ where: { merchantId } }),
  ]);
  return {
    items: items.map((t) => ({
      id: t.id,
      reference: t.reference,
      status: t.status,
      amount: t.amount.toString(),
      fee: t.fee.toString(),
      createdAt: t.createdAt.toISOString(),
    })),
    pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) },
  };
}

export async function getMerchantById(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) throw new NotFoundError('Marchand');
  return merchant;
}
