import { randomInt } from 'node:crypto';
import { prisma } from '@ecopye/database';
import { AppError } from '@ecopye/utils';
import {
  ERROR_CODES,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_SECONDS,
} from '@ecopye/constants';
import type { OtpRequestDto, OtpVerifyDto } from '@ecopye/types';
import { hashPin, verifyPin } from './hash';

function generateNumericCode(length: number): string {
  let code = '';
  for (let i = 0; i < length; i++) code += randomInt(0, 10).toString();
  return code;
}

export async function requestOtp(dto: OtpRequestDto) {
  const code = generateNumericCode(OTP_LENGTH);
  const codeHash = await hashPin(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

  const user = await prisma.user.findUnique({ where: { phoneNumber: dto.phoneNumber } });

  await prisma.otpCode.create({
    data: {
      userId: user?.id,
      phoneNumber: dto.phoneNumber,
      codeHash,
      purpose: dto.purpose,
      maxAttempts: OTP_MAX_ATTEMPTS,
      expiresAt,
    },
  });

  // TODO: notification-service.sendSms(dto.phoneNumber, `Votre code ECOPYE : ${code}`)
  // eslint-disable-next-line no-console
  console.log(`[OTP] ${dto.phoneNumber} / ${dto.purpose}: ${code}`);

  return { sent: true, expiresAt: expiresAt.toISOString() };
}

export async function verifyOtp(dto: OtpVerifyDto) {
  const record = await prisma.otpCode.findFirst({
    where: {
      phoneNumber: dto.phoneNumber,
      purpose: dto.purpose,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new AppError(ERROR_CODES.OTP_EXPIRED, 'OTP expiré ou inexistant', 422);
  }
  if (record.attempts >= record.maxAttempts) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { status: 'FAILED' },
    });
    throw new AppError(ERROR_CODES.OTP_TOO_MANY_ATTEMPTS, 'Trop de tentatives', 429);
  }

  const ok = await verifyPin(record.codeHash, dto.code);
  if (!ok) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: record.attempts + 1 },
    });
    throw new AppError(ERROR_CODES.OTP_INVALID, 'Code OTP invalide', 422);
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { status: 'VERIFIED', verifiedAt: new Date() },
  });

  return { verified: true };
}
