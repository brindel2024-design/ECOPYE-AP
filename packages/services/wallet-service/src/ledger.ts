import { prisma, Prisma } from '@ecopye/database';
import type { PaginationQuery } from '@ecopye/types';
import { NotFoundError } from '@ecopye/utils';

export async function listLedgerEntries(userId: string, q: PaginationQuery) {
  const wallet = await prisma.wallet.findFirst({ where: { userId, type: 'PERSONAL' } });
  if (!wallet) throw new NotFoundError('Wallet');

  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: q.limit,
      include: { transaction: { select: { reference: true, type: true, description: true } } },
    }),
    prisma.ledgerEntry.count({ where: { walletId: wallet.id } }),
  ]);

  return {
    items: items.map((e) => ({
      id: e.id,
      side: e.side,
      amount: e.amount.toString(),
      runningBalance: e.runningBalance.toString(),
      currency: e.currency,
      reference: e.transaction.reference,
      type: e.transaction.type,
      description: e.transaction.description,
      createdAt: e.createdAt.toISOString(),
    })),
    pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) },
  };
}

/**
 * Write a balanced pair of ledger entries for a transaction within an
 * existing Prisma transaction scope. Guarantees:
 *   - DEBIT(from) + CREDIT(to) = 0 in signed sum
 *   - wallet.balance decremented/incremented atomically
 *   - ledger_entries.runningBalance captures snapshot
 */
export async function writeBalancedTransfer(
  tx: Prisma.TransactionClient,
  opts: {
    transactionId: string;
    fromWalletId: string;
    toWalletId: string;
    amount: bigint;
    currency: string;
  },
) {
  const { transactionId, fromWalletId, toWalletId, amount, currency } = opts;

  const from = await tx.wallet.findUniqueOrThrow({ where: { id: fromWalletId } });
  const to = await tx.wallet.findUniqueOrThrow({ where: { id: toWalletId } });

  if (from.availableBalance < amount) {
    const err = new Error('INSUFFICIENT_FUNDS');
    (err as Error & { code?: string }).code = 'INSUFFICIENT_FUNDS';
    throw err;
  }

  const fromNew = from.availableBalance - amount;
  const toNew = to.availableBalance + amount;

  await tx.wallet.update({
    where: { id: fromWalletId, version: from.version },
    data: {
      balance: from.balance - amount,
      availableBalance: fromNew,
      dailySpent: from.dailySpent + amount,
      monthlySpent: from.monthlySpent + amount,
      version: { increment: 1 },
    },
  });
  await tx.wallet.update({
    where: { id: toWalletId, version: to.version },
    data: {
      balance: to.balance + amount,
      availableBalance: toNew,
      version: { increment: 1 },
    },
  });

  await tx.ledgerEntry.createMany({
    data: [
      {
        transactionId,
        walletId: fromWalletId,
        side: 'DEBIT',
        amount,
        currency,
        runningBalance: fromNew,
      },
      {
        transactionId,
        walletId: toWalletId,
        side: 'CREDIT',
        amount,
        currency,
        runningBalance: toNew,
      },
    ],
  });
}
