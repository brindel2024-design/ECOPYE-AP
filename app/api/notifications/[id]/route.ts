import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/notifications/[id] — marquer une notif comme lue
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  await db.notification.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: { isRead: true },
  })

  return NextResponse.json({ message: 'Lu' })
}
