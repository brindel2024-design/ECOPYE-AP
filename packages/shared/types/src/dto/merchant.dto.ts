import { z } from 'zod';

export const createMerchantSchema = z.object({
  legalName: z.string().min(2).max(200),
  tradingName: z.string().min(2).max(200),
  type: z.enum(['INDIVIDUAL', 'COMPANY', 'ASSOCIATION', 'GOVERNMENT']),
  mcc: z.string().regex(/^\d{4}$/).optional(),
  taxId: z.string().max(50).optional(),
  commercialRegister: z.string().max(50).optional(),
  wilaya: z.string().max(50),
  address: z.string().max(255),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().regex(/^\+213[567]\d{8}$/).optional(),
});
export type CreateMerchantDto = z.infer<typeof createMerchantSchema>;

export const createTerminalSchema = z.object({
  type: z.enum(['STATIC_QR', 'DYNAMIC_QR', 'POS', 'ONLINE']),
  label: z.string().max(100),
});
export type CreateTerminalDto = z.infer<typeof createTerminalSchema>;
