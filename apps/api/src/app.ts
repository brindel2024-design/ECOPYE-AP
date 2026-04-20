import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { randomUUID } from 'node:crypto';

import { loadConfig } from '@ecopye/config';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { envelopePlugin } from './plugins/envelope.js';
import { authPlugin } from './plugins/auth.js';
import { idempotencyPlugin } from './plugins/idempotency.js';

import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.routes.js';
import { walletRoutes } from './routes/wallet.routes.js';
import { transactionRoutes } from './routes/transaction.routes.js';
import { kycRoutes } from './routes/kyc.routes.js';
import { merchantRoutes } from './routes/merchant.routes.js';
import { billRoutes } from './routes/bill.routes.js';
import { cagnotteRoutes } from './routes/cagnotte.routes.js';
import { notificationRoutes } from './routes/notification.routes.js';
import { agentRoutes } from './routes/agent.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const config = loadConfig();

  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss Z' } }
          : undefined,
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', '*.pin', '*.pinHash', '*.refreshToken'],
        censor: '[REDACTED]',
      },
    },
    trustProxy: true,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: () => randomUUID(),
    bodyLimit: 1_048_576, // 1 MB
    ajv: { customOptions: { removeAdditional: 'all', coerceTypes: false } },
  });

  // ---- Core security & parsing plugins
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: config.CORS_ORIGINS.split(',').map((s) => s.trim()),
    credentials: true,
  });
  await app.register(sensible);
  await app.register(rateLimit, {
    max: config.RATE_LIMIT_GLOBAL,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    keyGenerator: (req) => (req.headers['x-real-ip'] as string) || req.ip,
  });

  // ---- App-specific plugins
  await app.register(errorHandlerPlugin);
  await app.register(envelopePlugin);
  await app.register(authPlugin);
  await app.register(idempotencyPlugin);

  // ---- OpenAPI
  if (config.NODE_ENV !== 'production') {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'ECOPYE API',
          description: 'API de paiement mobile algérienne',
          version: '0.1.0',
        },
        servers: [{ url: `${config.API_PUBLIC_URL}${config.API_PREFIX}` }],
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          },
        },
      },
    });
    await app.register(swaggerUi, { routePrefix: '/docs' });
  }

  // ---- Routes
  app.register(
    async (api) => {
      await api.register(healthRoutes);
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(walletRoutes, { prefix: '/wallets' });
      await api.register(transactionRoutes, { prefix: '/transactions' });
      await api.register(kycRoutes, { prefix: '/kyc' });
      await api.register(merchantRoutes, { prefix: '/merchants' });
      await api.register(billRoutes, { prefix: '/bills' });
      await api.register(cagnotteRoutes, { prefix: '/cagnottes' });
      await api.register(notificationRoutes, { prefix: '/notifications' });
      await api.register(agentRoutes, { prefix: '/agents' });
    },
    { prefix: config.API_PREFIX },
  );

  return app;
}
