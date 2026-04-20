import type { FastifyPluginAsync } from 'fastify';
import { paginationQuerySchema } from '@ecopye/types';
import { listNotifications, markAsRead, registerDeviceToken } from '@ecopye/notification-service';
import { z } from 'zod';

const registerTokenSchema = z.object({
  deviceFingerprint: z.string().min(8).max(128),
  pushToken: z.string().min(16).max(255),
  pushProvider: z.enum(['fcm', 'apns']),
  platform: z.enum(['ios', 'android', 'web']),
});

export const notificationRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', app.authenticate);

  app.get('/', async (req) => {
    const q = paginationQuerySchema.parse(req.query);
    return listNotifications(req.user!.sub, q);
  });

  app.post('/:id/read', async (req) => {
    const { id } = req.params as { id: string };
    return markAsRead(req.user!.sub, id);
  });

  app.post('/devices', async (req) => {
    const dto = registerTokenSchema.parse(req.body);
    return registerDeviceToken(req.user!.sub, dto);
  });
};
