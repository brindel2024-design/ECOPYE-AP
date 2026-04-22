import { db } from '@/lib/db'

type NotifType = 'transfer_received' | 'transfer_sent' | 'bill_paid' | 'cagnotte' | 'system'

interface CreateNotifInput {
  userId: string
  title: string
  body: string
  type: NotifType
  data?: Record<string, unknown>
}

export async function createNotification(input: CreateNotifInput) {
  return db.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type,
      data: input.data ? JSON.stringify(input.data) : null,
    },
  })
}

export async function createAuditLog(input: {
  userId?: string
  action: string
  resource?: string
  resourceId?: string
  status?: 'SUCCESS' | 'FAILED'
  metadata?: Record<string, unknown>
}) {
  return db.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      status: input.status ?? 'SUCCESS',
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  })
}
