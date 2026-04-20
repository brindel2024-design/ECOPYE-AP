import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { ConflictError, hashIdempotencyKey } from '@ecopye/utils';
import { prisma } from '@ecopye/database';

declare module 'fastify' {
  interface FastifyRequest {
    idempotencyKey?: string;
  }
  interface FastifyInstance {
    requireIdempotency: (req: FastifyRequest) => Promise<void>;
  }
}

/**
 * Enforces `Idempotency-Key` header on mutating transactional endpoints.
 * The key is hashed and used as a dedup primitive inside services.
 */
export const idempotencyPlugin: FastifyPluginAsync = fp(async (app) => {
  async function requireIdempotency(req: FastifyRequest): Promise<void> {
    const key = req.headers['idempotency-key'];
    if (!key || typeof key !== 'string' || key.length < 8) {
      throw new ConflictError('Header Idempotency-Key requis (8 caractères min)');
    }
    req.idempotencyKey = hashIdempotencyKey(key);
  }

  app.decorate('requireIdempotency', requireIdempotency);

  // Minimal reference to prisma to bind plugin (also ensures connection)
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
