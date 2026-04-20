import type { FastifyPluginAsync } from 'fastify';
import { getWalletSummary, listLedgerEntries } from '@ecopye/wallet-service';
import { paginationQuerySchema } from '@ecopye/types';

export const walletRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', app.authenticate);

  app.get('/me', async (req) => {
    return getWalletSummary(req.user!.sub);
  });

  app.get('/me/ledger', async (req) => {
    const q = paginationQuerySchema.parse(req.query);
    return listLedgerEntries(req.user!.sub, q);
  });
};
