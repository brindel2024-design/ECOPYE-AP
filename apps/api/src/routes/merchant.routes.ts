import type { FastifyPluginAsync } from 'fastify';
import { createMerchantSchema, createTerminalSchema, paginationQuerySchema } from '@ecopye/types';
import {
  createMerchant,
  listMyMerchants,
  createTerminal,
  listMerchantTransactions,
  getMerchantStats,
} from '@ecopye/merchant-service';

export const merchantRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', app.authenticate);

  app.get('/', async (req) => listMyMerchants(req.user!.sub));

  app.post('/', async (req) => {
    const dto = createMerchantSchema.parse(req.body);
    return createMerchant(req.user!.sub, dto);
  });

  app.get('/:id/stats', async (req) => {
    const { id } = req.params as { id: string };
    return getMerchantStats(req.user!.sub, id);
  });

  app.get('/:id/transactions', async (req) => {
    const { id } = req.params as { id: string };
    const q = paginationQuerySchema.parse(req.query);
    return listMerchantTransactions(req.user!.sub, id, q);
  });

  app.post('/:id/terminals', async (req) => {
    const { id } = req.params as { id: string };
    const dto = createTerminalSchema.parse(req.body);
    return createTerminal(req.user!.sub, id, dto);
  });
};
