import argon2 from 'argon2';
import { loadConfig } from '@ecopye/config';

export async function hashPin(pin: string): Promise<string> {
  const config = loadConfig();
  return argon2.hash(pin, {
    type: argon2.argon2id,
    memoryCost: config.ARGON2_MEMORY_COST,
    timeCost: config.ARGON2_TIME_COST,
    parallelism: config.ARGON2_PARALLELISM,
  });
}

export async function verifyPin(hash: string, pin: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, pin);
  } catch {
    return false;
  }
}
