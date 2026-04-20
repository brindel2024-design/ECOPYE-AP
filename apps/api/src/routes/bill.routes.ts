import type { FastifyPluginAsync } from 'fastify';
import { billLookupSchema, billPaySchema, mobileRechargeSchema } from '@ecopye/types';
import { lookupBill, payBill, rechargeMobile } from '@ecopye/payment-service';

export const billRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', app.authenticate);

  app.post('/lookup', async (req) => {
    const dto = billLookupSchema.parse(req.body);
    return lookupBill(dto);
  });

  app.post('/pay', { preHandler: app.requireIdempotency }, async (req) => {
    const dto = billPaySchema.parse(req.body);
    return payBill(req.user!.sub, dto, req.idempotencyKey!);
  });

  app.post('/recharge', { preHandler: app.requireIdempotency }, async (req) => {
    const dto = mobileRechargeSchema.parse(req.body);
    return rechargeMobile(req.user!.sub, dto, req.idempotencyKey!);
  });
};
