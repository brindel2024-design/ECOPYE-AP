import type { Prisma } from '@ecopye/database';

/**
 * Credit a wallet (e.g. cash-in, refund, BEA inbound). Pure ledger write,
 * no limit checks. Must be called inside a parent transaction.
 */
export async function creditWallet(
  tx: Prisma.TransactionClient,
  opts: {
    transactionId: string;
    walletId: string;
    amount: bigint;
    currency?: string;
  },
) {
  const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: opts.walletId } });
  const newBalance = wallet.availableBalance + opts.amount;
  await tx.wallet.update({
    where: { id: opts.walletId, version: wallet.version },
    data: {
      balance: wallet.balance + opts.amount,
      availableBalance: newBalance,
      version: { increment: 1 },
    },
  });
  await tx.ledgerEntry.create({
    data: {
      transactionId: opts.transactionId,
      walletId: opts.walletId,
      side: 'CREDIT',
      amount: opts.amount,
      currency: opts.currency ?? wallet.currency,
      runningBalance: newBalance,
    },
  });
}

export async function debitWallet(
  tx: Prisma.TransactionClient,
  opts: {
    transactionId: string;
    walletId: string;
    amount: bigint;
    currency?: string;
  },
) {
  const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: opts.walletId } });
  if (wallet.availableBalance < opts.amount) {
    throw new Error('INSUFFICIENT_FUNDS');
  }
  const newBalance = wallet.availableBalance - opts.amount;
  await tx.wallet.update({
    where: { id: opts.walletId, version: wallet.version },
    data: {
      balance: wallet.balance - opts.amount,
      availableBalance: newBalance,
      version: { increment: 1 },
    },
  });
  await tx.ledgerEntry.create({
    data: {
      transactionId: opts.transactionId,
      walletId: opts.walletId,
      side: 'DEBIT',
      amount: opts.amount,
      currency: opts.currency ?? wallet.currency,
      runningBalance: newBalance,
    },
  });
}
