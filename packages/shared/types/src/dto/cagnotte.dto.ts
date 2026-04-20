import { z } from 'zod';
import { amountSchema } from './transaction.dto';

export const createCagnotteSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  targetAmount: amountSchema,
  deadline: z.string().datetime().optional(),
  isPublic: z.boolean().default(true),
});
export type CreateCagnotteDto = z.infer<typeof createCagnotteSchema>;

export const contributeCagnotteSchema = z.object({
  cagnotteId: z.string().uuid(),
  amount: amountSchema,
  message: z.string().max(500).optional(),
  isAnonymous: z.boolean().default(false),
});
export type ContributeCagnotteDto = z.infer<typeof contributeCagnotteSchema>;
