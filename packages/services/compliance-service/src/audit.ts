import { prisma } from '@ecopye/database';

export interface AuditEntry {
  actorUserId?: string;
  actorAdminId?: string;
  action: string;
  entity: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function writeAudit(entry: AuditEntry) {
  return prisma.auditLog.create({
    data: {
      actorUserId: entry.actorUserId,
      actorAdminId: entry.actorAdminId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      ip: entry.ip,
      userAgent: entry.userAgent?.slice(0, 500),
      before: entry.before as object | undefined,
      after: entry.after as object | undefined,
      metadata: entry.metadata as object | undefined,
    },
  });
}
