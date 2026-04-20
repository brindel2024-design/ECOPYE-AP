import { prisma } from '@ecopye/database';
import type { NearbyAgentsQuery } from '@ecopye/types';

export async function listNearbyAgents(q: NearbyAgentsQuery) {
  const agents = await prisma.agent.findMany({
    where: { status: 'ACTIVE', wilaya: q.wilaya },
    orderBy: [{ rating: 'desc' }, { createdAt: 'asc' }],
    take: q.limit,
    select: {
      id: true,
      businessName: true,
      wilaya: true,
      address: true,
      latitude: true,
      longitude: true,
      commissionBps: true,
      rating: true,
    },
  });
  return agents.map((a) => ({
    id: a.id,
    businessName: a.businessName,
    wilaya: a.wilaya,
    address: a.address,
    latitude: a.latitude?.toString() ?? null,
    longitude: a.longitude?.toString() ?? null,
    commissionBps: a.commissionBps,
    rating: a.rating?.toString() ?? null,
  }));
}

export async function listAgentOperations(agentUserId: string, page = 1, limit = 20) {
  const agent = await prisma.agent.findUnique({ where: { userId: agentUserId } });
  if (!agent) return { items: [], pagination: { total: 0, page, limit, totalPages: 0 } };

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.cashOperation.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.cashOperation.count({ where: { agentId: agent.id } }),
  ]);

  return {
    items: items.map((o) => ({
      id: o.id,
      type: o.type,
      status: o.status,
      amount: o.amount.toString(),
      fee: o.fee.toString(),
      code: o.status === 'PENDING' ? o.code : null,
      createdAt: o.createdAt.toISOString(),
      completedAt: o.completedAt?.toISOString() ?? null,
    })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
