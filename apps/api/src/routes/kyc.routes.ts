import type { FastifyPluginAsync } from 'fastify';
import { kycSubmitSchema } from '@ecopye/types';
import { getKycStatus, submitKyc } from '@ecopye/kyc-service';

export const kycRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', app.authenticate);

  app.get('/status', async (req) => getKycStatus(req.user!.sub));

  app.post('/submit', async (req) => {
    const dto = kycSubmitSchema.parse(req.body);
    return submitKyc(req.user!.sub, dto);
  });
};
