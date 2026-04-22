import { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        phone: { label: 'Téléphone', type: 'text' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error('Veuillez renseigner votre téléphone et mot de passe')
        }

        // Normaliser le numéro
        let phone = credentials.phone.replace(/[\s\-\(\)]/g, '')
        if (phone.startsWith('0')) {
          phone = '+213' + phone.slice(1)
        }

        const user = await db.user.findUnique({
          where: { phone },
          include: { wallet: true },
        })

        if (!user) {
          throw new Error('Numéro de téléphone ou mot de passe incorrect')
        }

        if (!user.isActive) {
          throw new Error('Ce compte a été désactivé. Contactez le support.')
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) {
          throw new Error('Numéro de téléphone ou mot de passe incorrect')
        }

        return {
          id: user.id,
          phone: user.phone,
          name: user.fullName,
          email: user.email,
          image: user.avatar,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.phone = (user as any).phone
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).phone = token.phone
      }
      return session
    },
  },
}
