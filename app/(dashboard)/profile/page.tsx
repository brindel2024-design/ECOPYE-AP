import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { wallet: true },
  })

  if (!user) redirect('/login')

  const txCount = await db.transfer.count({
    where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
  })

  return (
    <ProfileClient
      user={{
        fullName: user.fullName,
        phone: user.phone,
        email: user.email || '',
        isVerified: user.isVerified,
        createdAt: user.createdAt.toISOString(),
        faceEnrolled: !!user.faceDescriptor,
        totpEnabled: user.totpEnabled,
      }}
      balance={Number(user.wallet?.balance || 0)}
      txCount={txCount}
    />
  )
}
