import { prisma } from '@ecopye/database';
import { NotFoundError } from '@ecopye/utils';
import type { WalletSummary } from '@ecopye/types';

export async function getWalletSummary(userId: string): Promise<WalletSummary> {
  const wallet = await prisma.wallet.findFirst({
    where: { userId, type: 'PERSONAL' },
  });
  if (!wallet) throw new NotFoundError('Wallet');
  return {
    id: wallet.id,
    type: wallet.type,
    status: wallet.status,
    currency: wallet.currency,
    balance: wallet.balance.toString(),
    availableBalance: wallet.availableBalance.toString(),
    reservedBalance: wallet.reservedBalance.toString(),
    dailyLimit: wallet.dailyLimit.toString(),
    monthlyLimit: wallet.monthlyLimit.toString(),
    dailySpent: wallet.dailySpent.toString(),
    monthlySpent: wallet.monthlySpent.toString(),
  };
}
