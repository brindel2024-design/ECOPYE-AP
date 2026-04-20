import { prisma } from '@ecopye/database';
import { NotFoundError } from '@ecopye/utils';
import type { PaginationQuery, TransactionSummary } from '@ecopye/types';

function toSummary(
  tx: {
    id: string;
    reference: string;
    type: string;
    status: string;
    amount: bigint;
    fee: bigint;
    currency: string;
    description: string | null;
    createdAt: Date;
    completedAt: Date | null;
    sender?: { profile: { firstName: string; lastName: string } | null; phoneNumber: string } | null;
    receiver?: { profile: { firstName: string; lastName: string } | null; phoneNumber: string } | null;
    merchantId: string | null;
  },
  perspective: 'sender' | 'receiver',
): TransactionSummary {
  const counterpartyRaw = perspective === 'sender' ? tx.receiver : tx.sender;
  const counterparty = counterpartyRaw
    ? {
        name: counterpartyRaw.profile
          ? `${counterpartyRaw.profile.firstName} ${counterpartyRaw.profile.lastName}`
          : null,
        phoneNumber: counterpartyRaw.phoneNumber,
        merchantId: tx.merchantId,
      }
    : null;
  return {
    id: tx.id,
    reference: tx.reference,
    type: tx.type,
    status: tx.status,
    amount: tx.amount.toString(),
    fee: tx.fee.toString(),
    currency: tx.currency,
    description: tx.description,
    counterparty,
    createdAt: tx.createdAt.toISOString(),
    completedAt: tx.completedAt?.toISOString() ?? null,
  };
}

export async function listTransactions(userId: string, q: PaginationQuery) {
  const skip = (q.page - 1) * q.limit;

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      skip,
      take: q.limit,
      include: {
        sender: { select: { phoneNumber: true, profile: { select: { firstName: true, lastName: true } } } },
        receiver: { select: { phoneNumber: true, profile: { select: { firstName: true, lastName: true } } } },
      },
    }),
    prisma.transaction.count({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    }),
  ]);

  return {
    items: items.map((tx) => toSummary(tx, tx.senderId === userId ? 'sender' : 'receiver')),
    pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) },
  };
}

export async function getTransactionByReference(userId: string, reference: string) {
  const tx = await prisma.transaction.findUnique({
    where: { reference },
    include: {
      sender: { select: { phoneNumber: true, profile: { select: { firstName: true, lastName: true } } } },
      receiver: { select: { phoneNumber: true, profile: { select: { firstName: true, lastName: true } } } },
      logs: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!tx) throw new NotFoundError('Transaction');
  if (tx.senderId !== userId && tx.receiverId !== userId) {
    throw new NotFoundError('Transaction');
  }
  return toSummary(tx, tx.senderId === userId ? 'sender' : 'receiver');
}
