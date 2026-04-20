import type { FastifyPluginAsync } from 'fastify';
import {
  registerAgentSchema,
  initiateCashOpSchema,
  completeCashOpSchema,
  nearbyAgentsQuerySchema,
} from '@ecopye/types';
import {
  registerAgent,
  getAgent,
  initiateCashIn,
  completeCashIn,
  initiateCashOut,
  completeCashOut,
  cancelCashOperation,
  listNearbyAgents,
  listAgentOperations,
} from '@ecopye/agent-service';

export const agentRoutes: FastifyPluginAsync = async (app) => {
  // Public: nearby agent lookup (unauthenticated by design for discovery)
  app.get('/nearby', async (req) => {
    const q = nearbyAgentsQuerySchema.parse(req.query);
    return listNearbyAgents(q);
  });

  app.get('/:id', async (req) => {
    const { id } = req.params as { id: string };
    return getAgent(id);
  });

  // Authenticated user flows
  app.register(async (scope) => {
    scope.addHook('onRequest', app.authenticate);

    scope.post('/register', async (req) => {
      const dto = registerAgentSchema.parse(req.body);
      return registerAgent(req.user!.sub, dto);
    });

    scope.get('/me/operations', async (req) => {
      const { page = '1', limit = '20' } = req.query as Record<string, string>;
      return listAgentOperations(req.user!.sub, Number(page), Number(limit));
    });

    scope.post(
      '/cash-in/initiate',
      { preHandler: app.requireIdempotency },
      async (req) => {
        const dto = initiateCashOpSchema.parse(req.body);
        return initiateCashIn(req.user!.sub, dto);
      },
    );

    scope.post(
      '/cash-in/complete',
      { preHandler: app.requireIdempotency },
      async (req) => {
        const { code } = completeCashOpSchema.parse(req.body);
        return completeCashIn(req.user!.sub, code);
      },
    );

    scope.post(
      '/cash-out/initiate',
      { preHandler: app.requireIdempotency },
      async (req) => {
        const dto = initiateCashOpSchema.parse(req.body);
        return initiateCashOut(req.user!.sub, dto);
      },
    );

    scope.post(
      '/cash-out/complete',
      { preHandler: app.requireIdempotency },
      async (req) => {
        const { code } = completeCashOpSchema.parse(req.body);
        return completeCashOut(req.user!.sub, code);
      },
    );

    scope.post('/operations/:id/cancel', async (req) => {
      const { id } = req.params as { id: string };
      return cancelCashOperation(req.user!.sub, id);
    });
  });
};
