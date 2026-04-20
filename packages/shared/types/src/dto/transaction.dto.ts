import { z } from 'zod';

export const amountSchema = z
  .union([z.string().regex(/^\d+$/), z.number().int().positive()])
  .transform((v) => BigInt(v))
  .refine((v) => v > 0n, 'Montant doit être > 0');

export const p2pTransferSchema = z.object({
  toPhoneNumber: z.string().regex(/^\+213[567]\d{8}$/),
  amount: amountSchema,
  description: z.string().max(255).optional(),
});
export type P2PTransferDto = z.infer<typeof p2pTransferSchema>;

export const qrPaymentSchema = z.object({
  qrPayload: z.string().min(8),
  amount: amountSchema.optional(), // Required for static QR, optional for dynamic
  description: z.string().max(255).optional(),
});
export type QrPaymentDto = z.infer<typeof qrPaymentSchema>;

export interface TransactionSummary {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: string;
  fee: string;
  currency: string;
  description: string | null;
  counterparty: {
    name: string | null;
    phoneNumber: string | null;
    merchantId: string | null;
  } | null;
  createdAt: string;
  completedAt: string | null;
}
