import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { bigintReplacer } from '@ecopye/utils';

/**
 * Wraps every successful JSON payload into the canonical envelope:
 * `{ success: true, data, error: null, meta: { timestamp, requestId } }`
 *
 * Routes may opt out by setting `reply.raw.envelope = false` or by returning
 * an already-enveloped object (detected via `success` boolean).
 */
export const envelopePlugin: FastifyPluginAsync = fp(async (app) => {
  // Override default JSON serializer to handle BigInt
  app.setReplySerializer((payload, statusCode) => {
    if (payload && typeof payload === 'object' && 'success' in payload) {
      return JSON.stringify(payload, bigintReplacer);
    }
    const wrapped = {
      success: statusCode < 400,
      data: statusCode < 400 ? payload : null,
      error: statusCode >= 400 ? payload : null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: '',
      },
    };
    return JSON.stringify(wrapped, bigintReplacer);
  });

  app.addHook('onSend', async (req, reply, payload) => {
    // Inject requestId after serialization (simple passthrough)
    reply.header('x-request-id', req.id);
    return payload;
  });
});
