import { prisma } from '@ecopye/database';
import {
  AppError,
  NotFoundError,
  generateTransactionReference,
} from '@ecopye/utils';
import { ERROR_CODES } from '@ecopye/constants';
import type { BillLookupDto, BillPayDto } from '@ecopye/types';
import { debitWallet, assertWithinLimits, resetCountersIfExpired } from '@ecopye/wallet-service';

/**
 * Provider abstraction — each provider (Sonelgaz, Algérie Télécom, etc.)
 * exposes a `lookup(accountNumber)` and `pay(tx)` method. For v3 MVP,
 * the stubs return a deterministic mock; swap for real clients in prod.
 */
interface ProviderStub {
  lookup(account: string): Promise<{ accountHolder: string; amountDue: bigint; dueDate: string } | null>;
  pay(account: string, amount: bigint, txRef: string): Promise<{ providerRef: string }>;
}

const stubProvider: ProviderStub = {
  async lookup(account) {
    return {
      accountHolder: `Titulaire ${account.slice(-4)}`,
      amountDue: 0n, // 0 = libre, client entre le montant
      dueDate: new Date(Date.now() + 7 * 86400_000).toISOString(),
    };
  },
  async pay(_account, _amount, txRef) {
    return { providerRef: `PROV-${txRef}` };
  },
};

export async function lookupBill(dto: BillLookupDto) {
  const result = await stubProvider.lookup(dto.accountNumber);
  if (!result) throw new AppError(ERROR_CODES.BILL_REFERENCE_INVALID, 'Référence introuvable', 404);
  return {
    provider: dto.provider,
    accountNumber: dto.accountNumber,
    accountHolder: result.accountHolder,
    amountDue: result.amountDue.toString(),
    dueDate: result.dueDate,
  };
}

export async function payBill(userId: string, dto: BillPayDto, idempotencyKey: string) {
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
        type: 'BILL_PAYMENT',
        status: 'PROCESSING',
        currency: 'DZD',
        amount: dto.amount,
        senderId: user.id,
        senderWalletId: wallet.id,
        description: `Facture ${dto.provider} ${dto.accountNumber}`,
      },
    });

    await debitWallet(tx, { transactionId: row.id, walletId: wallet.id, amount: dto.amount });

    const providerRef = await stubProvider.pay(dto.accountNumber, dto.amount, reference);

    await tx.billPayment.create({
      data: {
        userId: user.id,
        transactionId: row.id,
        provider: dto.provider,
        accountNumber: dto.accountNumber,
        billReference: dto.billReference,
        amount: dto.amount,
        providerStatus: 'PAID',
        providerResponse: providerRef as object,
      },
    });

    const completed = await tx.transaction.update({
      where: { id: row.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        externalReference: providerRef.providerRef,
      },
    });
    return completed;
  });

  return { reference: txRow.reference, status: txRow.status };
}
