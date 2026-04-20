import { prisma } from '@ecopye/database';
import { NotFoundError } from '@ecopye/utils';
import type { PaginationQuery } from '@ecopye/types';

export interface SendPushInput {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Persist & dispatch a notification. Actual provider dispatch
 * (FCM/APNS) happens in a background worker; here we just enqueue.
 */
export async function sendNotification(input: SendPushInput, channel: 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP' = 'PUSH') {
  const n = await prisma.notification.create({
    data: {
      userId: input.userId,
      channel,
      status: 'PENDING',
      title: input.title,
      body: input.body,
      data: input.data as object | undefined,
    },
  });
  // TODO: enqueue BullMQ job `notification.dispatch`
  return { id: n.id, status: n.status };
}

export async function sendSms(phoneNumber: string, body: string) {
  // TODO: Twilio integration in prod
  // eslint-disable-next-line no-console
  console.log(`[SMS -> ${phoneNumber}] ${body}`);
}

export async function listNotifications(userId: string, q: { page: number; limit: number }) {
  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: q.limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);
  return {
    items: items.map((n) => ({
      id: n.id,
      channel: n.channel,
      status: n.status,
      title: n.title,
      body: n.body,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    pagination: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) },
  };
}

export async function markAsRead(userId: string, id: string) {
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n || n.userId !== userId) throw new NotFoundError('Notification');
  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date(), status: 'READ' },
  });
}

export async function registerDeviceToken(
  userId: string,
  dto: {
    deviceFingerprint: string;
    pushToken: string;
    pushProvider: 'fcm' | 'apns';
    platform: 'ios' | 'android' | 'web';
  },
) {
  return prisma.device.upsert({
    where: { userId_fingerprint: { userId, fingerprint: dto.deviceFingerprint } },
    update: {
      pushToken: dto.pushToken,
      pushProvider: dto.pushProvider,
      platform: dto.platform,
      lastSeenAt: new Date(),
    },
    create: {
      userId,
      fingerprint: dto.deviceFingerprint,
      pushToken: dto.pushToken,
      pushProvider: dto.pushProvider,
      platform: dto.platform,
    },
  });
}

export type { PaginationQuery };
