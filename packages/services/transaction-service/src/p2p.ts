import { prisma } from '@ecopye/database';
import {
  AppError,
  ConflictError,
  NotFoundError,
  generateTransactionReference,
} from '@ecopye/utils';
import { ERROR_CODES, FEES_BPS } from '@ecopye/constants';
import type { P2PTransferDto } from '@ecopye/types';
import { writeBalancedTransfer, assertWithinLimits, resetCountersIfExpired } from '@ecopye/wallet-service';

export async function executeP2PTransfer(
  senderId: string,
  dto: P2PTransferDto,
  idempotencyKey: string,
) {
  // Idempotency replay check
  const existing = await prisma.transaction.findUnique({
    where: { idempotencyKey },
  });
  if (existing) {
    return { reference: existing.reference, status: existing.status, replayed: true };
  }

  const sender = await prisma.user.findUniqueOrThrow({
    where: { id: senderId },
    include: { wallets: { where: { type: 'PERSONAL' } } },
  });
  const senderWallet = sender.wallets[0];
  if (!senderWallet) throw new NotFoundError('Wallet source');

  const receiver = await prisma.user.findUnique({
    where: { phoneNumber: dto.toPhoneNumber },
    include: { wallets: { where: { type: 'PERSONAL' } } },
  });
  if (!receiver || receiver.deletedAt) throw new NotFoundError('Destinataire');
  const receiverWallet = receiver.wallets[0];
  if (!receiverWallet) throw new NotFoundError('Wallet destinataire');

  if (sender.id === receiver.id) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Impossible de se transférer à soi-même', 422);
  }
  if (senderWallet.status !== 'ACTIVE') {
    throw new AppError(ERROR_CODES.WALLET_FROZEN, 'Wallet bloqué', 403);
  }

  const reference = generateTransactionReference();

  try {
    const txRow = await prisma.$transaction(async (tx) => {
      await resetCountersIfExpired(tx, senderWallet.id);
      const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: senderWallet.id } });

      assertWithinLimits(wallet, sender.kycLevel, dto.amount);

      const row = await tx.transaction.create({
        data: {
          reference,
          idempotencyKey,
          type: 'P2P_TRANSFER',
          status: 'PROCESSING',
          currency: 'DZD',
          amount: dto.amount,
          fee: BigInt(FEES_BPS.P2P_TRANSFER),
          senderId: sender.id,
          senderWalletId: senderWallet.id,
          receiverId: receiver.id,
          receiverWalletId: receiverWallet.id,
          description: dto.description ?? null,
        },
      });

      await writeBalancedTransfer(tx, {
        transactionId: row.id,
        fromWalletId: senderWallet.id,
        toWalletId: receiverWallet.id,
        amount: dto.amount,
        currency: 'DZD',
      });

      const completed = await tx.transaction.update({
        where: { id: row.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      await tx.transactionLog.create({
        data: {
          transactionId: row.id,
          previousStatus: 'PROCESSING',
          newStatus: 'COMPLETED',
          actorType: 'system',
        },
      });
      return completed;
    });

    return { reference: txRow.reference, status: txRow.status, amount: txRow.amount.toString() };
  } catch (err) {
    if ((err as { code?: string }).code === 'INSUFFICIENT_FUNDS') {
      throw new AppError(ERROR_CODES.INSUFFICIENT_FUNDS, 'Solde insuffisant', 422);
    }
    if ((err as { code?: string }).code === 'P2002') {
      throw new ConflictError('Conflit idempotence');
    }
    throw err;
  }
}
