import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { readFileSync } from 'node:fs';
import { loadConfig } from '@ecopye/config';
import { UnauthorizedError } from '@ecopye/utils';
import { verifyAccessToken, type AccessTokenPayload } from '@ecopye/auth-service';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AccessTokenPayload;
  }
  interface FastifyInstance {
    authenticate: (req: FastifyRequest) => Promise<void>;
    authenticateOptional: (req: FastifyRequest) => Promise<void>;
  }
}

export const authPlugin: FastifyPluginAsync = fp(async (app) => {
  const config = loadConfig();
  const publicKey = readFileSync(config.JWT_PUBLIC_KEY_PATH, 'utf8');

  async function authenticate(req: FastifyRequest): Promise<void> {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token manquant');
    }
    const token = header.slice('Bearer '.length);
    try {
      const payload = await verifyAccessToken(token, publicKey, {
        issuer: config.JWT_ISSUER,
        audience: config.JWT_AUDIENCE,
      });
      req.user = payload;
    } catch (err) {
      req.log.warn({ err }, 'Token verification failed');
      throw new UnauthorizedError('Token invalide ou expiré');
    }
  }

  async function authenticateOptional(req: FastifyRequest): Promise<void> {
    if (!req.headers.authorization) return;
    await authenticate(req);
  }

  app.decorate('authenticate', authenticate);
  app.decorate('authenticateOptional', authenticateOptional);
});
