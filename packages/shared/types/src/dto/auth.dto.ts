import { z } from 'zod';

const algerianPhone = z
  .string()
  .regex(/^\+213[567]\d{8}$/, 'Numéro algérien invalide (+213 5/6/7 xxxxxxxx)');

const pin = z.string().regex(/^\d{6}$/, 'PIN doit faire 6 chiffres');
const deviceFingerprint = z.string().min(8).max(128);

export const registerSchema = z.object({
  phoneNumber: algerianPhone,
  pin,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  deviceFingerprint,
  locale: z.string().default('fr-DZ'),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  phoneNumber: algerianPhone,
  pin,
  deviceFingerprint,
});
export type LoginDto = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(16),
});
export type RefreshDto = z.infer<typeof refreshSchema>;

export const otpRequestSchema = z.object({
  phoneNumber: algerianPhone,
  purpose: z.enum(['REGISTRATION', 'LOGIN', 'TRANSACTION', 'PIN_RESET', 'PHONE_CHANGE']),
});
export type OtpRequestDto = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  phoneNumber: algerianPhone,
  code: z.string().regex(/^\d{6}$/),
  purpose: z.enum(['REGISTRATION', 'LOGIN', 'TRANSACTION', 'PIN_RESET', 'PHONE_CHANGE']),
});
export type OtpVerifyDto = z.infer<typeof otpVerifySchema>;

export const changePinSchema = z.object({
  currentPin: pin,
  newPin: pin,
});
export type ChangePinDto = z.infer<typeof changePinSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  user: {
    id: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    kycLevel: string;
    status: string;
  };
  tokens: AuthTokens;
}
