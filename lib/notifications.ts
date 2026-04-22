import { NotificationType, AuditAction, AuditStatus, Prisma } from '@prisma/client'
import { db } from '@/lib/db'

interface CreateNotifInput {
  userId: string
  title: string
  body: string
  type: NotificationType
  data?: Record<string, unknown>
}

export async function createNotification(input: CreateNotifInput) {
  return db.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type,
      data: input.data as Prisma.InputJsonValue ?? undefined,
    },
  })
}

export async function createAuditLog(input: {
  userId?: string
  action: AuditAction
  resource?: string
  resourceId?: string
  status?: AuditStatus
  metadata?: Record<string, unknown>
}) {
  return db.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      status: input.status ?? 'SUCCESS',
      metadata: input.metadata as Prisma.InputJsonValue ?? undefined,
    },
  })
}
