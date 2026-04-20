import { z } from 'zod';

export const kycSubmitSchema = z.object({
  requestedLevel: z.enum(['LEVEL_1', 'LEVEL_2', 'LEVEL_3']),
  documents: z
    .array(
      z.object({
        type: z.enum([
          'NATIONAL_ID',
          'PASSPORT',
          'DRIVER_LICENSE',
          'SELFIE',
          'PROOF_OF_ADDRESS',
          'PROOF_OF_INCOME',
          'BUSINESS_LICENSE',
          'TAX_CERTIFICATE',
        ]),
        s3Key: z.string().min(1),
        checksum: z.string().min(16),
      }),
    )
    .min(1),
});
export type KycSubmitDto = z.infer<typeof kycSubmitSchema>;

export interface KycStatusView {
  currentLevel: 'LEVEL_0' | 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
  pendingLevel: string | null;
  lastUpdatedAt: string | null;
  rejectionReason: string | null;
  limits: {
    dailyLimit: string;
    monthlyLimit: string;
    maxSingleTx: string;
  };
}
