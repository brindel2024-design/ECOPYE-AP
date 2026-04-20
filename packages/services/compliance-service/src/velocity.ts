import { prisma } from '@ecopye/database';
import { VELOCITY_RULES } from '@ecopye/constants';

export interface VelocityContext {
  userId: string;
  amount: bigint;
}

/**
 * Check velocity rules. Returns `{ passed: boolean, reason?: string }`.
 * Writes an Alert row when a rule trips.
 */
export async function checkVelocity(ctx: VelocityContext) {
  const now = new Date();
  const oneMinAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [perMinute, perHour, sumHour] = await Promise.all([
    prisma.transaction.count({
      where: { senderId: ctx.userId, createdAt: { gte: oneMinAgo } },
    }),
    prisma.transaction.count({
      where: { senderId: ctx.userId, createdAt: { gte: oneHourAgo } },
    }),
    prisma.transaction.aggregate({
      where: { senderId: ctx.userId, createdAt: { gte: oneHourAgo } },
      _sum: { amount: true },
    }),
  ]);

  const sumHourAmount = (sumHour._sum.amount ?? 0n) + ctx.amount;
  let reason: string | null = null;
  if (perMinute >= VELOCITY_RULES.MAX_TX_PER_MINUTE) reason = 'VELOCITY_TX_PER_MINUTE';
  else if (perHour >= VELOCITY_RULES.MAX_TX_PER_HOUR) reason = 'VELOCITY_TX_PER_HOUR';
  else if (sumHourAmount > VELOCITY_RULES.MAX_AMOUNT_PER_HOUR) reason = 'VELOCITY_AMOUNT_PER_HOUR';

  if (reason) {
    await prisma.alert.create({
      data: {
        userId: ctx.userId,
        ruleCode: reason,
        severity: 'HIGH',
        status: 'OPEN',
        title: `Vélocité anormale détectée (${reason})`,
        context: { perMinute, perHour, sumHour: sumHourAmount.toString() },
      },
    });
    return { passed: false, reason };
  }

  return { passed: true, reason: null };
}
