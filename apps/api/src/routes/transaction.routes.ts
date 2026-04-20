import type { FastifyPluginAsync } from 'fastify';
import { p2pTransferSchema, qrPaymentSchema, paginationQuerySchema } from '@ecopye/types';
import {
  executeP2PTransfer,
  executeQrPayment,
  listTransactions,
  getTransactionByReference,
} from '@ecopye/transaction-service';

export const transactionRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', app.authenticate);

  app.get('/', async (req) => {
    const q = paginationQuerySchema.parse(req.query);
    return listTransactions(req.user!.sub, q);
  });

  app.get('/:reference', async (req) => {
    const { reference } = req.params as { reference: string };
    return getTransactionByReference(req.user!.sub, reference);
  });

  app.post(
    '/p2p',
    { preHandler: app.requireIdempotency },
    async (req) => {
      const dto = p2pTransferSchema.parse(req.body);
      return executeP2PTransfer(req.user!.sub, dto, req.idempotencyKey!);
    },
  );

  app.post(
    '/qr',
    { preHandler: app.requireIdempotency },
    async (req) => {
      const dto = qrPaymentSchema.parse(req.body);
      return executeQrPayment(req.user!.sub, dto, req.idempotencyKey!);
    },
  );
};
