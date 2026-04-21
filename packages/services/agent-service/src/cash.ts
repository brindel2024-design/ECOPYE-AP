import { randomBytes } from 'node:crypto';
import { prisma } from '@ecopye/database';
import {
  AppError,
  NotFoundError,
  generateTransactionReference,
  applyBps,
} from '@ecopye/utils';
import { ERROR_CODES, AGENT_COMMISSION_BPS } from '@ecopye/constants';
import type { InitiateCashOpDto } from '@ecopye/types';
import { writeBalancedTransfer, assertWithinLimits, resetCountersIfExpired } from '@ecopye/wallet-service';

const CODE_TTL_MINUTES = 15;

function generateCashCode(): string {
  // 8 uppercase alphanumerics, avoid ambiguous chars (0/O/1/I)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]!).join('');
}

async function findUserPersonalWallet(userId: string) {
  const w = await prisma.wallet.findFirst({ where: { userId, type: 'PERSONAL' } });
  if (!w) throw new NotFoundError('Wallet');
  return w;
}

async function findAgentWallet(agentId: string) {
  const w = await prisma.wallet.findFirst({ where: { agentId, type: 'AGENT' } });
  if (!w) throw new NotFoundError('Wallet agent');
  return w;
}

export async function initiateCashIn(userId: string, dto: InitiateCashOpDto) {
  const agent = await prisma.agent.findUnique({ where: { id: dto.agentId } });
  if (!agent || agent.status !== 'ACTIVE') throw new NotFoundError('Agent');

  const code = generateCashCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

  const op = await prisma.cashOperation.create({
    data: {
      agentId: dto.agentId,
      userId,
      type: 'CASH_IN',
      amount: dto.amount,
      status: 'PENDING',
      code,
      codeExpiresAt: expiresAt,
    },
  });
  return { id: op.id, code, expiresAt: expiresAt.toISOString() };
}

export async function completeCashIn(agentUserId: string, code: string) {
  const agent = await prisma.agent.findUnique({ where: { userId: agentUserId } });
  if (!agent || agent.status !== 'ACTIVE') throw new NotFoundError('Agent');

  const op = await prisma.cashOperation.findUnique({ where: { code } });
  if (!op || op.status !== 'PENDING') throw new NotFoundError('Opération');
  if (op.agentId !== agent.id) throw new AppError(ERROR_CODES.AUTH_FORBIDDEN, 'Code non destiné à cet agent', 403);
  if (op.codeExpiresAt < new Date()) {
    await prisma.cashOperation.update({ where: { id: op.id }, data: { status: 'CANCELLED' } });
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Code expiré', 410);
  }
  if (op.type !== 'CASH_IN') throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Type opération invalide', 422);

  const agentWallet = await findAgentWallet(agent.id);
  const userWallet = await findUserPersonalWallet(op.userId);
  const reference = generateTransactionReference();

  const completed = await prisma.$transaction(async (tx) => {
    const row = await tx.transaction.create({
      data: {
        reference,
        idempotencyKey: `cashin:${op.id}`,
        type: 'AGENT_CASH_IN',
        status: 'PROCESSING',
        currency: 'DZD',
        amount: op.amount,
        senderId: agentUserId,
        senderWalletId: agentWallet.id,
        receiverId: op.userId,
        receiverWalletId: userWallet.id,
        agentId: agent.id,
        description: `Cash-in via agent ${agent.businessName}`,
      },
    });

    await writeBalancedTransfer(tx, {
      transactionId: row.id,
      fromWalletId: agentWallet.id,
      toWalletId: userWallet.id,
      amount: op.amount,
      currency: 'DZD',
    });

    await tx.cashOperation.update({
      where: { id: op.id },
      data: { status: 'COMPLETED', transactionId: row.id, completedAt: new Date() },
    });

    return tx.transaction.update({
      where: { id: row.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  });

  return { reference: completed.reference, status: completed.status };
}

export async function initiateCashOut(userId: string, dto: InitiateCashOpDto) {
  const agent = await prisma.agent.findUnique({ where: { id: dto.agentId } });
  if (!agent || agent.status !== 'ACTIVE') throw new NotFoundError('Agent');

  const code = generateCashCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000);

  const op = await prisma.cashOperation.create({
    data: {
      agentId: dto.agentId,
      userId,
      type: 'CASH_OUT',
      amount: dto.amount,
      fee: applyBps(dto.amount, AGENT_COMMISSION_BPS),
      status: 'PENDING',
      code,
      codeExpiresAt: expiresAt,
    },
  });
  return { id: op.id, code, fee: op.fee.toString(), expiresAt: expiresAt.toISOString() };
}

export async function completeCashOut(agentUserId: string, code: string) {
  const agent = await prisma.agent.findUnique({ where: { userId: agentUserId } });
  if (!agent || agent.status !== 'ACTIVE') throw new NotFoundError('Agent');

  const op = await prisma.cashOperation.findUnique({ where: { code } });
  if (!op || op.status !== 'PENDING') throw new NotFoundError('Opération');
  if (op.agentId !== agent.id) throw new AppError(ERROR_CODES.AUTH_FORBIDDEN, 'Code non destiné à cet agent', 403);
  if (op.codeExpiresAt < new Date()) {
    await prisma.cashOperation.update({ where: { id: op.id }, data: { status: 'CANCELLED' } });
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Code expiré', 410);
  }
  if (op.type !== 'CASH_OUT') throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Type opération invalide', 422);

  const userWallet = await findUserPersonalWallet(op.userId);
  const agentWallet = await findAgentWallet(agent.id);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: op.userId } });
  const reference = generateTransactionReference();
  const fee = op.fee;
  const gross = op.amount;

  const completed = await prisma.$transaction(async (tx) => {
    await resetCountersIfExpired(tx, userWallet.id);
    const fresh = await tx.wallet.findUniqueOrThrow({ where: { id: userWallet.id } });
    assertWithinLimits(fresh, user.kycLevel, gross);

    const row = await tx.transaction.create({
      data: {
        reference,
        idempotencyKey: `cashout:${op.id}`,
        type: 'AGENT_CASH_OUT',
        status: 'PROCESSING',
        currency: 'DZD',
        amount: gross,
        fee,
        netAmount: gross - fee,
        senderId: op.userId,
        senderWalletId: userWallet.id,
        receiverId: agentUserId,
        receiverWalletId: agentWallet.id,
        agentId: agent.id,
        description: `Cash-out via agent ${agent.businessName}`,
      },
    });

    // Débit complet du user, crédit net à l'agent, commission vers wallet SYSTEM
    await writeBalancedTransfer(tx, {
      transactionId: row.id,
      fromWalletId: userWallet.id,
      toWalletId: agentWallet.id,
      amount: gross - fee,
      currency: 'DZD',
    });

    if (fee > 0n) {
      const systemWallet = await tx.wallet.findFirst({ where: { type: 'SYSTEM' } });
      if (systemWallet) {
        await writeBalancedTransfer(tx, {
          transactionId: row.id,
          fromWalletId: userWallet.id,
          toWalletId: systemWallet.id,
          amount: fee,
          currency: 'DZD',
        });
      }
    }

    await tx.cashOperation.update({
      where: { id: op.id },
      data: { status: 'COMPLETED', transactionId: row.id, completedAt: new Date() },
    });

    return tx.transaction.update({
      where: { id: row.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  });

  return { reference: completed.reference, status: completed.status };
}

export async function cancelCashOperation(userId: string, operationId: string) {
  const op = await prisma.cashOperation.findUnique({ where: { id: operationId } });
  if (!op) throw new NotFoundError('Opération');
  if (op.userId !== userId) throw new AppError(ERROR_CODES.AUTH_FORBIDDEN, 'Opération d\'un autre utilisateur', 403);
  if (op.status !== 'PENDING') {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 'Opération non annulable', 422);
  }
  return prisma.cashOperation.update({ where: { id: operationId }, data: { status: 'CANCELLED' } });
}
