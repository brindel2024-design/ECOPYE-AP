import { prisma } from '@ecopye/database';

export async function logout(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return { loggedOut: true };
}
