import type { Prisma } from '@ecopye/database';
import { AppError } from '@ecopye/utils';
import { ERROR_CODES, KYC_LIMITS, type KycLevelCode } from '@ecopye/constants';

/** Reset daily/monthly counters if the period has elapsed. */
export async function resetCountersIfExpired(
  tx: Prisma.TransactionClient,
  walletId: string,
): Promise<void> {
  const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });
  const now = new Date();
  const last = wallet.lastLimitResetAt;
  const sameDay = last.toDateString() === now.toDateString();
  const sameMonth = last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth();

  const updates: Prisma.WalletUpdateInput = {};
  if (!sameDay) updates.dailySpent = 0n;
  if (!sameMonth) updates.monthlySpent = 0n;
  if (!sameDay || !sameMonth) updates.lastLimitResetAt = now;

  if (Object.keys(updates).length > 0) {
    await tx.wallet.update({ where: { id: walletId }, data: updates });
  }
}

/** Throws if the single-tx, daily, or monthly limit would be exceeded. */
export function assertWithinLimits(
  wallet: {
    dailyLimit: bigint;
    monthlyLimit: bigint;
    dailySpent: bigint;
    monthlySpent: bigint;
  },
  kycLevel: KycLevelCode,
  amount: bigint,
): void {
  const kyc = KYC_LIMITS[kycLevel];
  if (amount > kyc.maxSingleTx) {
    throw new AppError(
      ERROR_CODES.KYC_INSUFFICIENT,
      `Montant supérieur au plafond par transaction pour le niveau KYC ${kycLevel}`,
      422,
    );
  }
  if (wallet.dailySpent + amount > wallet.dailyLimit) {
    throw new AppError(ERROR_CODES.DAILY_LIMIT_EXCEEDED, 'Plafond quotidien dépassé', 422);
  }
  if (wallet.monthlySpent + amount > wallet.monthlyLimit) {
    throw new AppError(ERROR_CODES.MONTHLY_LIMIT_EXCEEDED, 'Plafond mensuel dépassé', 422);
  }
}
