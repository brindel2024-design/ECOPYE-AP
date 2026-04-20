import { PrismaClient, Prisma } from './generated/client';

declare global {
  // eslint-disable-next-line no-var
  var __ecopye_prisma__: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn']
        : ['query', 'info', 'warn', 'error'],
    errorFormat: 'pretty',
  });
}

export const prisma: PrismaClient =
  globalThis.__ecopye_prisma__ ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__ecopye_prisma__ = prisma;
}

export { Prisma };
export * from './generated/client';
