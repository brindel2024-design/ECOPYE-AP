import { z } from 'zod';
import { amountSchema } from './transaction.dto';

export const BILL_PROVIDERS = [
  'SONELGAZ',
  'ALGERIE_TELECOM',
  'DJEZZY',
  'OOREDOO',
  'MOBILIS',
  'SEAAL',
  'CNAS',
] as const;

export const billLookupSchema = z.object({
  provider: z.enum(BILL_PROVIDERS),
  accountNumber: z.string().min(3).max(50),
});
export type BillLookupDto = z.infer<typeof billLookupSchema>;

export const billPaySchema = z.object({
  provider: z.enum(BILL_PROVIDERS),
  accountNumber: z.string().min(3).max(50),
  amount: amountSchema,
  billReference: z.string().max(100).optional(),
});
export type BillPayDto = z.infer<typeof billPaySchema>;

export const mobileRechargeSchema = z.object({
  provider: z.enum(['DJEZZY', 'OOREDOO', 'MOBILIS']),
  phoneNumber: z.string().regex(/^\+213[567]\d{8}$/),
  amount: amountSchema,
});
export type MobileRechargeDto = z.infer<typeof mobileRechargeSchema>;
