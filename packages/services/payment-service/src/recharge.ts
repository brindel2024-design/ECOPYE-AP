import { prisma } from '@ecopye/database';
import { NotFoundError, generateTransactionReference } from '@ecopye/utils';
import type { MobileRechargeDto } from '@ecopye/types';
import { debitWallet, assertWithinLimits, resetCountersIfExpired } from '@ecopye/wallet-service';

export async function rechargeMobile(userId: string, dto: MobileRechargeDto, idempotencyKey: string) {
  const existing = await prisma.transaction.findUnique({ where: { idempotencyKey } });
  if (existing) return { reference: existing.reference, status: existing.status, replayed: true };

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { wallets: { where: { type: 'PERSONAL' } } },
  });
  const wallet = user.wallets[0];
  if (!wallet) throw new NotFoundError('Wallet');

  const reference = generateTransactionReference();

  const txRow = await prisma.$transaction(async (tx) => {
    await resetCountersIfExpired(tx, wallet.id);
    const w = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
    assertWithinLimits(w, user.kycLevel, dto.amount);

    const row = await tx.transaction.create({
      data: {
        reference,
        idempotencyKey,
        type: 'MOBILE_RECHARGE',
        status: 'PROCESSING',
        currency: 'DZD',
        amount: dto.amount,
        senderId: user.id,
        senderWalletId: wallet.id,
        description: `Recharge ${dto.provider} ${dto.phoneNumber}`,
        metadata: { provider: dto.provider, targetPhone: dto.phoneNumber },
      },
    });
    await debitWallet(tx, { transactionId: row.id, walletId: wallet.id, amount: dto.amount });
    return tx.transaction.update({
      where: { id: row.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  });

  return { reference: txRow.reference, status: txRow.status };
}
