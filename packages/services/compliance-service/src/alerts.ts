import { prisma } from '@ecopye/database';

export async function openAlert(params: {
  userId?: string;
  ruleCode: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description?: string;
  context?: Record<string, unknown>;
}) {
  return prisma.alert.create({
    data: {
      userId: params.userId,
      ruleCode: params.ruleCode,
      severity: params.severity,
      title: params.title,
      description: params.description,
      context: params.context as object | undefined,
    },
  });
}

export async function resolveAlert(alertId: string, resolvedBy: string, note: string) {
  return prisma.alert.update({
    where: { id: alertId },
    data: {
      status: 'RESOLVED',
      assigneeId: resolvedBy,
      resolvedAt: new Date(),
      resolutionNote: note,
    },
  });
}
