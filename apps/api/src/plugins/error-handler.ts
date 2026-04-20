import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '@ecopye/utils';
import { ERROR_CODES } from '@ecopye/constants';

export const errorHandlerPlugin: FastifyPluginAsync = fp(async (app) => {
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) {
      req.log.warn({ issues: err.issues, url: req.url }, 'Validation failed');
      return reply.status(422).send({
        success: false,
        data: null,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Paramètres invalides',
          details: { issues: err.issues },
        },
        meta: { timestamp: new Date().toISOString(), requestId: req.id },
      });
    }

    if (err instanceof AppError) {
      req.log.warn({ code: err.code, url: req.url }, err.message);
      return reply.status(err.statusCode).send({
        success: false,
        data: null,
        error: { code: err.code, message: err.message, details: err.details },
        meta: { timestamp: new Date().toISOString(), requestId: req.id },
      });
    }

    // Fastify built-in rate-limit
    if ((err as { statusCode?: number }).statusCode === 429) {
      return reply.status(429).send({
        success: false,
        data: null,
        error: {
          code: ERROR_CODES.RATE_LIMITED,
          message: 'Trop de requêtes — réessayez plus tard',
        },
        meta: { timestamp: new Date().toISOString(), requestId: req.id },
      });
    }

    req.log.error({ err, url: req.url }, 'Unhandled error');
    return reply.status(500).send({
      success: false,
      data: null,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Erreur interne du serveur',
      },
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  });

  app.setNotFoundHandler((req, reply) => {
    reply.status(404).send({
      success: false,
      data: null,
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: `Route ${req.method} ${req.url} introuvable`,
      },
      meta: { timestamp: new Date().toISOString(), requestId: req.id },
    });
  });
});
