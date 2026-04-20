import { prisma } from '@ecopye/database';
import { SANCTIONS_SCREEN_THRESHOLD } from '@ecopye/constants';

export interface ScreeningInput {
  transactionId: string;
  targetType: 'user' | 'counterparty' | 'merchant';
  targetRef: string;
  fullName?: string;
  amount: bigint;
  isInternational?: boolean;
}

/**
 * Screen a counterparty against configured sanctions lists.
 * Returns `CLEAR` | `POTENTIAL_MATCH` | `CONFIRMED_MATCH`.
 *
 * Current impl is a stub — integrate with compliance-service worker that
 * ingests OFAC/UN/EU feeds into `sanctioned_entities` table.
 */
export async function screenSanctions(input: ScreeningInput) {
  const mustScreen = input.isInternational || input.amount >= SANCTIONS_SCREEN_THRESHOLD;
  if (!mustScreen) return { result: 'CLEAR' as const, screened: false };

  // TODO: real fuzzy match against ingested lists
  const result = 'CLEAR' as const;

  await prisma.sanctionsScreening.create({
    data: {
      transactionId: input.transactionId,
      targetType: input.targetType,
      targetRef: input.targetRef,
      listSource: 'INTERNAL',
      result,
    },
  });

  return { result, screened: true };
}
