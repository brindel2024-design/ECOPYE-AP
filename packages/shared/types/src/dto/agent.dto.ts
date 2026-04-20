import { z } from 'zod';

export const registerAgentSchema = z.object({
  businessName: z.string().min(2).max(200),
  licenseNumber: z.string().min(3).max(50),
  wilaya: z.string().max(50),
  address: z.string().max(255),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
export type RegisterAgentDto = z.infer<typeof registerAgentSchema>;

export const initiateCashOpSchema = z.object({
  agentId: z.string().uuid(),
  amount: z.bigint().positive(),
});
export type InitiateCashOpDto = z.infer<typeof initiateCashOpSchema>;

export const completeCashOpSchema = z.object({
  code: z.string().length(8),
});
export type CompleteCashOpDto = z.infer<typeof completeCashOpSchema>;

export const nearbyAgentsQuerySchema = z.object({
  wilaya: z.string().max(50),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type NearbyAgentsQuery = z.infer<typeof nearbyAgentsQuerySchema>;
