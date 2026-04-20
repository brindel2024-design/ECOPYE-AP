import { prisma } from '@ecopye/database';
import {
  AppError,
  NotFoundError,
  applyBps,
  generateTransactionReference,
} from '@ecopye/utils';
import { ERROR_CODES, MERCHANT_DEFAULT_COMMISSION_BPS } from '@ecopye/constants';
import type { QrPaymentDto } from '@ecopye/types';
import { writeBalancedTransfer, assertWithinLimits, resetCountersIfExpired } from '@ecopye/wallet-service';

interface QrPayload {
  version: number;
  type: 'static' | 'dynamic';
  merchantId: string;
  terminalId: string;
  amount?: string; // centimes DZD for dynamic
  nonce: string;
}

function decodeQr(payload: string): QrPayload {
  try {
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(json) as QrPayload;
  } catch {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'QR code invalide', 422);
  }
}

export async function executeQrPayment(
  payerId: string,
  dto: QrPaymentDto,
  idempotencyKey: string,
) {
  const existing = await prisma.transaction.findUnique({ where: { idempotencyKey } });
  if (existing) return { reference: existing.reference, status: existing.status, replayed: true };

  const qr = decodeQr(dto.qrPayload);

  const merchant = await prisma.merchant.findUnique({
    where: { id: qr.merchantId },
    include: { wallets: { where: { type: 'MERCHANT' } } },
  });
  if (!merchant || merchant.deletedAt) throw new NotFoundError('Marchand');
  if (merchant.status !== 'ACTIVE') {
    throw new AppError(ERROR_CODES.MERCHANT_NOT_ACTIVE, 'Marchand inactif', 403);
  }
  const merchantWallet = merchant.wallets[0];
  if (!merchantWallet) throw new NotFoundError('Wallet marchand');

  const payer = await prisma.user.findUniqueOrThrow({
    where: { id: payerId },
    include: { wallets: { where: { type: 'PERSONAL' } } },
  });
  const payerWallet = payer.wallets[0];
  if (!payerWallet) throw new NotFoundError('Wallet payeur');

  const amount = qr.amount ? BigInt(qr.amount) : dto.amount;
  if (!amount || amount <= 0n) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Montant requis pour un QR statique', 422);
  }

  const commissionBps = merchant.commissionBps ?? MERCHANT_DEFAULT_COMMISSION_BPS;
  const fee = applyBps(amount, commissionBps);
  const reference = generateTransactionReference();

  const txRow = await prisma.$transaction(async (tx) => {
    await resetCountersIfExpired(tx, payerWallet.id);
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: payerWallet.id } });
    assertWithinLimits(wallet, payer.kycLevel, amount);

    const row = await tx.transaction.create({
      data: {
        reference,
        idempotencyKey,
        type: 'QR_PAYMENT',
        status: 'PROCESSING',
        currency: 'DZD',
        amount,
        fee,
        senderId: payer.id,
        senderWalletId: payerWallet.id,
        receiverWalletId: merchantWallet.id,
        merchantId: merchant.id,
        description: dto.description ?? `Paiement ${merchant.tradingName}`,
        metadata: { terminalId: qr.terminalId, qrType: qr.type },
      },
    });

    // Full amount leaves payer, merchant receives (amount - fee). Fee stays on system wallet.
    await writeBalancedTransfer(tx, {
      transactionId: row.id,
      fromWalletId: payerWallet.id,
      toWalletId: merchantWallet.id,
      amount: amount - fee,
      currency: 'DZD',
    });

    if (fee > 0n) {
      const systemWallet = await tx.wallet.findFirstOrThrow({ where: { type: 'SYSTEM' } });
      await writeBalancedTransfer(tx, {
        transactionId: row.id,
        fromWalletId: payerWallet.id,
        toWalletId: systemWallet.id,
        amount: fee,
        currency: 'DZD',
      });
    }

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
}
