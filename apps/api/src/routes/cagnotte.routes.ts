import type { FastifyPluginAsync } from 'fastify';
import { createCagnotteSchema, contributeCagnotteSchema, paginationQuerySchema } from '@ecopye/types';
import {
  createCagnotte,
  listMyCagnottes,
  getCagnotteBySlug,
  contributeToCagnotte,
} from '@ecopye/payment-service';

export const cagnotteRoutes: FastifyPluginAsync = async (app) => {
  app.get('/public/:slug', async (req) => {
    const { slug } = req.params as { slug: string };
    return getCagnotteBySlug(slug);
  });

  app.addHook('onRequest', app.authenticateOptional);

  app.get('/me', { onRequest: app.authenticate }, async (req) => {
    const q = paginationQuerySchema.parse(req.query);
    return listMyCagnottes(req.user!.sub, q);
  });

  app.post('/', { onRequest: app.authenticate }, async (req) => {
    const dto = createCagnotteSchema.parse(req.body);
    return createCagnotte(req.user!.sub, dto);
  });

  app.post('/contribute', { onRequest: app.authenticate, preHandler: app.requireIdempotency }, async (req) => {
    const dto = contributeCagnotteSchema.parse(req.body);
    return contributeToCagnotte(req.user!.sub, dto, req.idempotencyKey!);
  });
};
