export const KYC_LEVELS = {
  LEVEL_0: 'LEVEL_0',
  LEVEL_1: 'LEVEL_1',
  LEVEL_2: 'LEVEL_2',
  LEVEL_3: 'LEVEL_3',
} as const;

export type KycLevelCode = (typeof KYC_LEVELS)[keyof typeof KYC_LEVELS];

/** Plafonds en centimes DZD */
export const KYC_LIMITS: Record<
  KycLevelCode,
  { dailyLimit: bigint; monthlyLimit: bigint; maxSingleTx: bigint }
> = {
  LEVEL_0: {
    dailyLimit: 0n,
    monthlyLimit: 0n,
    maxSingleTx: 0n,
  },
  LEVEL_1: {
    dailyLimit: 1_000_000n, // 10 000 DZD
    monthlyLimit: 30_000_000n, // 300 000 DZD
    maxSingleTx: 500_000n, // 5 000 DZD
  },
  LEVEL_2: {
    dailyLimit: 20_000_000n, // 200 000 DZD
    monthlyLimit: 500_000_000n, // 5 000 000 DZD
    maxSingleTx: 5_000_000n, // 50 000 DZD
  },
  LEVEL_3: {
    dailyLimit: 100_000_000n, // 1 000 000 DZD
    monthlyLimit: 3_000_000_000n, // 30 000 000 DZD
    maxSingleTx: 50_000_000n, // 500 000 DZD
  },
};
